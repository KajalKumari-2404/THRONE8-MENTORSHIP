const test = require("node:test");
const assert = require("node:assert/strict");

const {
  initiateTransfer,
  fetchTransferStatus,
} = require("../services/payoutProvider");

test("mock provider returns deterministic transfer ID and success", async () => {
  const input = {
    mentorAccount: { providerAccountId: "mock_account_test" },
    amountPaise: 80000,
    idempotencyKey: "test-payout-attempt-1",
  };

  const first = await initiateTransfer(input);
  const second = await initiateTransfer(input);

  assert.equal(first.status, "SUCCEEDED");
  assert.equal(first.providerTransferId, second.providerTransferId);
  assert.match(first.providerTransferId, /^mock_tfr_[a-f0-9]{20}$/);
});

test("mock provider rejects missing mentor payout account", async () => {
  await assert.rejects(
    initiateTransfer({
      mentorAccount: {},
      amountPaise: 80000,
      idempotencyKey: "test-payout-no-account",
    }),
    { code: "NO_LINKED_ACCOUNT" }
  );
});

test("mock reconciliation never claims an unknown transfer succeeded", async () => {
  const result = await fetchTransferStatus("mock_tfr_test");

  assert.equal(result.status, "UNKNOWN");
});

test("mock reconciliation rejects a missing transfer ID", async () => {
  await assert.rejects(
    fetchTransferStatus(""),
    { code: "TRANSFER_ID_REQUIRED" }
  );
});
