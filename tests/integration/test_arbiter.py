"""Integration tests — require GenLayer Studio running (local or hosted).

Run with: gltest tests/integration/ -v -s

The judging test reads a real page (https://example.com) and asks real LLM
validators to agree, so it takes a few minutes.
"""

import pytest
from gltest import get_contract_factory, default_account
from gltest.helpers import load_fixture
from gltest.assertions import tx_execution_succeeded


def deploy_contract():
    factory = get_contract_factory("Arbiter")
    contract = factory.deploy()
    assert contract.get_bounties(args=[]) == []
    assert contract.get_points(args=[]) == {}
    return contract


@pytest.mark.integration
def test_create_and_close_bounty():
    contract = load_fixture(deploy_contract)

    result = contract.create_bounty(
        args=[
            "Close-me bounty",
            "A bounty that the creator closes without any submissions.",
            "Nothing needs to be submitted for this bounty.",
            5,
        ]
    )
    assert tx_execution_succeeded(result)

    bounties = contract.get_bounties(args=[])
    assert len(bounties) == 1
    assert bounties[0]["creator"] == default_account.address
    assert bounties[0]["status"] == "open"

    result = contract.close_bounty(args=[0])
    assert tx_execution_succeeded(result)
    assert contract.get_bounty(args=[0])["status"] == "closed"


@pytest.mark.integration
def test_judged_submission():
    """The default account posts; a second account submits example.com."""
    from gltest import get_accounts

    contract = load_fixture(deploy_contract)
    result = contract.create_bounty(
        args=[
            "Find the IANA example domain page",
            "Link to the page that explains the reserved example domain.",
            "The page says the domain is for use in documentation or illustrative examples.",
            10,
        ]
    )
    assert tx_execution_succeeded(result)

    hunter = get_accounts()[1]
    result = contract.connect(hunter).submit_work(
        args=[0, "https://example.com"],
        wait_interval=10000,
        wait_retries=30,
    )
    assert tx_execution_succeeded(result)

    subs = contract.get_submissions(args=[0])
    assert len(subs) == 1
    assert subs[0]["verdict"] in ("accepted", "rejected")
    if subs[0]["verdict"] == "accepted":
        assert contract.get_bounty(args=[0])["status"] == "awarded"
        assert contract.get_player_points(args=[hunter.address]) == 10
