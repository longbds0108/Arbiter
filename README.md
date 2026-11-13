# Arbiter — AI-judged bounties on GenLayer

Arbiter is a bounty board built on the [GenLayer project boilerplate](https://github.com/genlayerlabs/genlayer-project-boilerplate).

1. A **creator** posts a bounty: what they want made, the acceptance criteria, and a reward from 1 to 100 reputation points.
2. A **hunter** submits a public `https://` link to their work: a blog post, a repo, a thread. Each hunter gets 3 attempts per bounty.
3. The **intelligent contract** loads the page with `gl.nondet.web.render`. An LLM scores the work from 0 to 100 against the criteria and returns `accepted` or `rejected` with a reason.
4. **Validators** repeat the judgement. Under `gl.eq_principle.prompt_comparative`, they must reach the same verdict, and their scores can differ by at most 15.
5. A submission wins when the verdict is `accepted` and the score is 60 or more. The bounty closes and the hunter receives the reward points. Rejected submissions stay on record with their reason.

The prompt marks the page text as data and tells the judge to ignore any instructions inside it. This helps against prompt injection.

## Deployment

| Network | Contract |
|---|---|
| GenLayer Studio (studionet, chain 61999) | `0x94d1c9DC83336bA6247f6C7bCFfE1C119F1Dc7b4` |

## Structure

```
contracts/arbiter.py        Intelligent contract
tests/direct/               Fast in-memory tests with web/LLM mocks (19 tests)
tests/integration/          End-to-end tests against GenLayer Studio
deploy/deployScript.ts      Used by `genlayer deploy`
frontend/                   Next.js 16 + genlayer-js app (UI from the Defi repo, EN/VI)
```

### Contract API

| Method | Kind | Notes |
|---|---|---|
| `create_bounty(title, brief, criteria, reward) -> int` | write | Title 4–120 chars, brief/criteria 10–1200, reward 1–100 |
| `submit_work(bounty_id, url)` | write | Non-deterministic: reads the URL and judges the work |
| `close_bounty(bounty_id)` | write | Creator only, open bounties only |
| `get_bounties()`, `get_bounty(id)` | view | |
| `get_submissions(bounty_id)`, `get_hunter_submissions(addr)` | view | |
| `get_points()`, `get_player_points(addr)`, `get_stats()` | view | |

## Quick start

> **Folder name:** don't put this project in a folder whose path contains `:` (for example `Genlayer_13:11`). Python refuses to create a venv there, and tools that add the folder to `PATH` break. Rename the folder to `Genlayer_13-11` first.

```bash
# 1. Python tools (Python 3.12+)
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# 2. Lint + direct tests
genvm-lint check contracts/arbiter.py
pytest tests/direct/ -v

# 3. Deploy (needs the GenLayer CLI: npm i -g genlayer)
genlayer network          # choose studionet or localnet
genlayer deploy           # prints the contract address

# 4. Frontend
cd frontend
cp .env.example .env      # set NEXT_PUBLIC_CONTRACT_ADDRESS
npm install
npm run dev               # http://localhost:3000
```

On macOS with the python.org installer, the tests fail to download GenVM with `CERTIFICATE_VERIFY_FAILED`. To fix it, run `Install Certificates.command` from the Python folder in Applications, or set `export SSL_CERT_FILE=$(python -m certifi)`.

Integration tests need a GenLayer Studio, either local or hosted:

```bash
gltest tests/integration/ -v -s
```

## Frontend

- Wallet: MetaMask through `window.ethereum`. genlayer-js signs writes, and the network chip adds or switches to GenLayer Studio (chain 61999).
- Every write shows its status in order: checking → confirm in wallet → validators agreeing → confirmed or failed, with the transaction hash. Revert reasons are translated.
- All data is read live from the contract. If the contract isn't deployed, or a list is empty, the page says so.
- UI is ported from [longbds0108/Defi](https://github.com/longbds0108/Defi): `app/defi.css` holds its workspace styles (floating header, left sidebar, `ui-card`, `metric-card`, `vault-card`, `ui-button`, `status-pill`, `empty-state`, `data-table`). `app/app.css` adds the Arbiter-only pieces. Every string has English and Vietnamese versions via `t(en, vi)`.

## License

MIT
