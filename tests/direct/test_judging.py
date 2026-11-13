"""Submission judging — requires web + LLM mocks."""

import json

from tests.direct.conftest import to_hex

CONTRACT = "contracts/arbiter.py"
WORK_URL = "https://blog.example.com/genlayer-explainer"


def _post(contract, reward=25):
    return contract.create_bounty(
        "Write a GenLayer explainer",
        "A blog post explaining intelligent contracts to web2 developers.",
        "At least 600 words. Mentions the equivalence principle. Includes a code sample.",
        reward,
    )


def _mock_judge(vm, verdict, score, reason="Meets every criterion."):
    vm.clear_mocks()
    vm.mock_web(
        r".*blog\.example\.com.*",
        {"status": 200, "body": "Intelligent contracts explained ... equivalence principle ..."},
    )
    vm.mock_llm(
        r".*impartial judge for a work bounty.*",
        json.dumps({"verdict": verdict, "score": score, "reason": reason}),
    )


def test_accepted_submission_awards_bounty(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy(CONTRACT)
    direct_vm.sender = direct_alice
    _post(contract, reward=25)

    direct_vm.sender = direct_bob
    _mock_judge(direct_vm, "accepted", 88)
    contract.submit_work(0, WORK_URL)

    bob = to_hex(direct_bob)
    bounty = contract.get_bounty(0)
    assert bounty["status"] == "awarded"
    assert bounty["winner"] == bob
    assert bounty["submission_count"] == 1

    subs = contract.get_submissions(0)
    assert len(subs) == 1
    assert subs[0]["hunter"] == bob
    assert subs[0]["url"] == WORK_URL
    assert subs[0]["verdict"] == "accepted"
    assert subs[0]["score"] == 88
    assert subs[0]["reason"] == "Meets every criterion."

    assert contract.get_player_points(bob) == 25
    assert contract.get_points() == {bob: 25}
    assert contract.get_stats()["points_awarded"] == 25


def test_rejected_submission_keeps_bounty_open(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy(CONTRACT)
    direct_vm.sender = direct_alice
    _post(contract)

    direct_vm.sender = direct_bob
    _mock_judge(direct_vm, "rejected", 30, "No code sample.")
    contract.submit_work(0, WORK_URL)

    assert contract.get_bounty(0)["status"] == "open"
    sub = contract.get_submissions(0)[0]
    assert sub["verdict"] == "rejected"
    assert sub["reason"] == "No code sample."
    assert contract.get_player_points(to_hex(direct_bob)) == 0


def test_accepted_but_low_score_is_rejected(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy(CONTRACT)
    direct_vm.sender = direct_alice
    _post(contract)

    direct_vm.sender = direct_bob
    _mock_judge(direct_vm, "accepted", 59)
    contract.submit_work(0, WORK_URL)

    assert contract.get_bounty(0)["status"] == "open"
    assert contract.get_submissions(0)[0]["verdict"] == "rejected"


def test_malformed_llm_output_is_normalised(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy(CONTRACT)
    direct_vm.sender = direct_alice
    _post(contract)

    direct_vm.sender = direct_bob
    _mock_judge(direct_vm, "ACCEPT!!", 250, "x" * 500)
    contract.submit_work(0, WORK_URL)

    sub = contract.get_submissions(0)[0]
    assert sub["verdict"] == "rejected"
    assert sub["score"] == 100
    assert len(sub["reason"]) == 280


def test_creator_cannot_submit(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy(CONTRACT)
    direct_vm.sender = direct_alice
    _post(contract)
    with direct_vm.expect_revert("Creators cannot submit to their own bounty"):
        contract.submit_work(0, WORK_URL)


def test_url_must_be_https(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy(CONTRACT)
    direct_vm.sender = direct_alice
    _post(contract)
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("Submit a single https:// URL"):
        contract.submit_work(0, "http://insecure.example.com")
    with direct_vm.expect_revert("Submit a single https:// URL"):
        contract.submit_work(0, "https://a.com https://b.com")


def test_attempt_limit(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy(CONTRACT)
    direct_vm.sender = direct_alice
    _post(contract)

    direct_vm.sender = direct_bob
    for _ in range(3):
        _mock_judge(direct_vm, "rejected", 20)
        contract.submit_work(0, WORK_URL)

    with direct_vm.expect_revert("No attempts left on this bounty"):
        contract.submit_work(0, WORK_URL)

    assert len(contract.get_hunter_submissions(to_hex(direct_bob))) == 3


def test_awarded_bounty_takes_no_more_submissions(
    direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie
):
    contract = direct_deploy(CONTRACT)
    direct_vm.sender = direct_alice
    _post(contract)

    direct_vm.sender = direct_bob
    _mock_judge(direct_vm, "accepted", 90)
    contract.submit_work(0, WORK_URL)

    direct_vm.sender = direct_charlie
    with direct_vm.expect_revert("Bounty is not open"):
        contract.submit_work(0, WORK_URL)


def test_closed_bounty_takes_no_submissions(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy(CONTRACT)
    direct_vm.sender = direct_alice
    _post(contract)
    contract.close_bounty(0)

    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("Bounty is not open"):
        contract.submit_work(0, WORK_URL)


def test_points_accumulate_across_bounties(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy(CONTRACT)
    direct_vm.sender = direct_alice
    _post(contract, reward=10)
    _post(contract, reward=15)

    direct_vm.sender = direct_bob
    _mock_judge(direct_vm, "accepted", 80)
    contract.submit_work(0, WORK_URL)
    _mock_judge(direct_vm, "accepted", 75)
    contract.submit_work(1, WORK_URL)

    assert contract.get_player_points(to_hex(direct_bob)) == 25
    stats = contract.get_stats()
    assert stats["awarded"] == 2
    assert stats["open"] == 0
    assert stats["submissions"] == 2
