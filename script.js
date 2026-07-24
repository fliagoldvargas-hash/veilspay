const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add("visible");
  });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

const veilConfig = {
  tokenSymbol: "$VEIL",
  contractAddress: "Ds28wMScEFn1ztgwKYM1m2d2Qse6p6jXJhW6KpZppump",
  ...(window.VEIL_PAY_CONFIG || {}),
};

const contractPill = document.querySelector("[data-contract-pill]");

if (contractPill) {
  const tokenSymbol = contractPill.querySelector("[data-token-symbol]");
  const contractAddress = contractPill.querySelector("[data-contract-address]");
  const copyStatus = contractPill.querySelector("[data-copy-status]");
  let copiedTimer = null;

  tokenSymbol.textContent = veilConfig.tokenSymbol;
  contractAddress.textContent = veilConfig.contractAddress;

  contractPill.addEventListener("click", async () => {
    const address = veilConfig.contractAddress.trim();
    if (!address) return;

    try {
      await navigator.clipboard.writeText(address);
      contractPill.classList.add("copied");
      copyStatus.textContent = "Copied";
      window.clearTimeout(copiedTimer);
      copiedTimer = window.setTimeout(() => {
        contractPill.classList.remove("copied");
        copyStatus.textContent = "Copy";
      }, 1800);
    } catch {
      copyStatus.textContent = "Copy failed";
      window.clearTimeout(copiedTimer);
      copiedTimer = window.setTimeout(() => {
        copyStatus.textContent = "Copy";
      }, 1800);
    }
  });
}

const connectWalletButton = document.querySelector("[data-connect-wallet]");

if (connectWalletButton) {
  const shortAddress = (value) => `${value.slice(0, 4)}...${value.slice(-4)}`;
  let walletTimer = null;

  connectWalletButton.addEventListener("click", async () => {
    window.clearTimeout(walletTimer);

    if (!window.solana?.isPhantom) {
      connectWalletButton.textContent = "Install Phantom";
      return;
    }

    try {
      connectWalletButton.textContent = "Connecting...";
      const response = await window.solana.connect();
      connectWalletButton.classList.add("connected");
      connectWalletButton.textContent = shortAddress(response.publicKey.toString());
    } catch {
      connectWalletButton.textContent = "Connection failed";
      walletTimer = window.setTimeout(() => {
        connectWalletButton.textContent = "Connect wallet";
      }, 1800);
    }
  });
}

const bridgeWidget = document.querySelector(".bridge-widget");

if (bridgeWidget) {
  const amountButtons = Array.from(bridgeWidget.querySelectorAll(".amount"));
  const destinationInput = bridgeWidget.querySelector("#destination");
  const addressField = bridgeWidget.querySelector(".address-field");
  const submitButton = bridgeWidget.querySelector(".bridge-submit");
  const feeNote = bridgeWidget.querySelector("[data-fee-note]");
  const statusPanel = bridgeWidget.querySelector("[data-bridge-status]");
  const feeRate = 0.005;
  let selectedAmount = 0.1;
  let currentStepTimer = null;

  const formatSol = (value) => {
    const fixed = Number(value).toFixed(6);
    return fixed.replace(/0+$/, "").replace(/\.$/, "");
  };

  const decodeBase58 = (value) => {
    const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    const bytes = [0];

    for (const char of value) {
      const carryStart = alphabet.indexOf(char);
      if (carryStart < 0) return null;
      let carry = carryStart;

      for (let index = 0; index < bytes.length; index += 1) {
        carry += bytes[index] * 58;
        bytes[index] = carry & 0xff;
        carry >>= 8;
      }

      while (carry > 0) {
        bytes.push(carry & 0xff);
        carry >>= 8;
      }
    }

    for (const char of value) {
      if (char !== "1") break;
      bytes.push(0);
    }

    return bytes.reverse();
  };

  const isValidSolanaAddress = (value) => {
    const trimmed = value.trim();
    if (trimmed.length < 32 || trimmed.length > 44) return false;
    const decoded = decodeBase58(trimmed);
    return Array.isArray(decoded) && decoded.length === 32;
  };

  const shortAddress = (value) => `${value.slice(0, 4)}...${value.slice(-4)}`;

  const setSummaryView = () => {
    statusPanel.classList.remove("flow-message");
    statusPanel.innerHTML = `
      <div><span>Selected</span><strong>${formatSol(selectedAmount)} SOL</strong></div>
      <div><span>Fee</span><strong>${formatSol(selectedAmount * feeRate)} SOL</strong></div>
      <div><span>You receive</span><strong>${formatSol(selectedAmount)} SOL</strong></div>
    `;
  };

  const setFlowMessage = (title, text) => {
    statusPanel.classList.add("flow-message");
    statusPanel.innerHTML = `<strong>${title}</strong>${text}`;
  };

  const updateFee = () => {
    const fee = selectedAmount * feeRate;
    const deposit = selectedAmount + fee;
    feeNote.textContent = `You send ${formatSol(deposit)} SOL (incl. 0.5% fee) and receive ${formatSol(selectedAmount)} SOL`;
    if (!statusPanel.classList.contains("flow-message")) setSummaryView();
  };

  const updateValidation = () => {
    const value = destinationInput.value.trim();
    const valid = isValidSolanaAddress(value);
    addressField.classList.toggle("valid", valid);
    addressField.classList.toggle("invalid", value.length > 0 && !valid);
    submitButton.disabled = !valid;
    submitButton.textContent = "Start private bridge";
    if (!valid && !statusPanel.classList.contains("flow-message")) setSummaryView();
    return valid;
  };

  amountButtons.forEach((button) => {
    button.addEventListener("click", () => {
      amountButtons.forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      selectedAmount = Number(button.dataset.amount);
      updateFee();
      updateValidation();
    });
  });

  destinationInput.addEventListener("input", () => {
    window.clearTimeout(currentStepTimer);
    if (statusPanel.classList.contains("flow-message")) setSummaryView();
    updateValidation();
  });

  submitButton.addEventListener("click", async () => {
    if (!updateValidation()) {
      setFlowMessage("Invalid destination", "Paste a valid Solana address to start a private bridge.");
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Preparing bridge...";
    const destination = destinationInput.value.trim();
    let walletText = "Demo mode";

    try {
      if (window.solana?.isPhantom) {
        const response = await window.solana.connect();
        walletText = `Wallet ${shortAddress(response.publicKey.toString())}`;
      }
    } catch {
      walletText = "Wallet connection skipped";
    }

    setFlowMessage(
      "Confirm private bridge",
      `${walletText} · Send ${formatSol(selectedAmount + selectedAmount * feeRate)} SOL total. Clean payout target: ${shortAddress(destination)}.`
    );

    currentStepTimer = window.setTimeout(() => {
      submitButton.textContent = "Waiting for deposit...";
      setFlowMessage("Waiting for deposit", "Watching for your fresh deposit. This demo simulates the bridge watcher and status updates.");
    }, 1400);

    window.setTimeout(() => {
      submitButton.textContent = "Clean payout ready";
      setFlowMessage("Clean payout ready", `${formatSol(selectedAmount)} SOL is queued for payout from a clean wallet to ${shortAddress(destination)}.`);
    }, 3400);

    window.setTimeout(() => {
      submitButton.disabled = false;
      submitButton.textContent = "Start private bridge";
    }, 5200);
  });

  updateFee();
  updateValidation();
}
