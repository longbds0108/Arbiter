"""Bounty creation, closing and view methods (no web/LLM needed)."""

from tests.direct.conftest import to_hex

CONTRACT = "contracts/arbiter.py"


def _post(contract, title="Write a GenLayer explainer", reward=25):
    return contract.create_bounty(
        title,
        "A blog post explaining intelligent contracts to web2 developers.",
        "At least 600 words. Mentions the equivalence principle. Includes a code sample.",
        reward,
    )


def test_create_bounty(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy(CONTRACT)
    direct_vm.sender = direct_alice

    bounty_id = _post(contract)
    assert bounty_id == 0

    bounty = contract.get_bounty(0)
    assert bounty["id"] == 0
    assert bounty["creator"] == to_hex(direct_alice)
    assert bounty["title"] == "Write a GenLayer explainer"
    assert bounty["reward"] == 25
    assert bounty["status"] == "open"
    assert bounty["winner"] == ""
    assert bounty["submission_count"] == 0


def test_ids_increment(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy(CONTRACT)
    direct_vm.sender = direct_alice
    assert _post(contract, "First bounty") == 0
    direct_vm.sender = direct_bob
    assert _post(contract, "Second bounty") == 1

    bounties = contract.get_bounties()
    assert [b["title"] for b in bounties] == ["First bounty", "Second bounty"]
    assert bounties[1]["creator"] == to_hex(direct_bob)


def test_fields_are_trimmed(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy(CONTRACT)
    direct_vm.sender = direct_alice
    _post(contract, "   Padded title   ")
    assert contract.get_bounty(0)["title"] == "Padded title"


def test_reward_bounds(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy(CONTRACT)
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("Reward must be between 1 and 100"):
        _post(contract, reward=0)
    with direct_vm.expect_revert("Reward must be between 1 and 100"):
        _post(contract, reward=101)


def test_short_fields_rejected(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy(CONTRACT)
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("Title is too short"):
        contract.create_bounty("ab", "A long enough brief", "Long enough criteria", 5)
    with direct_vm.expect_revert("Brief is too short"):
        contract.create_bounty("Valid title", "short", "Long enough criteria", 5)
    with direct_vm.expect_revert("Criteria is too short"):
        contract.create_bounty("Valid title", "A long enough brief", "short", 5)


def test_creator_closes_bounty(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy(CONTRACT)
    direct_vm.sender = direct_alice
    _post(contract)
    contract.close_bounty(0)
    assert contract.get_bounty(0)["status"] == "closed"

    with direct_vm.expect_revert("Bounty is not open"):
        contract.close_bounty(0)


def test_only_creator_closes(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy(CONTRACT)
    direct_vm.sender = direct_alice
    _post(contract)
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("Only the creator can close this bounty"):
        contract.close_bounty(0)


def test_unknown_bounty(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy(CONTRACT)
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("Bounty not found"):
        contract.get_bounty(3)
    with direct_vm.expect_revert("Bounty not found"):
        contract.close_bounty(0)


def test_empty_state_views(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy(CONTRACT)
    assert contract.get_bounties() == []
    assert contract.get_submissions(0) == []
    assert contract.get_points() == {}
    assert contract.get_player_points(to_hex(direct_alice)) == 0
    assert contract.get_stats() == {
        "bounties": 0,
        "open": 0,
        "awarded": 0,
        "submissions": 0,
        "points_awarded": 0,
    }
