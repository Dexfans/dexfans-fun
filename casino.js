/* DexFans Casino — Play-Money Game Engine */

(() => {
  "use strict";

  const STORAGE_KEY = "dexfans_casino_balance";
  const STARTING_BALANCE = 10000;

  const SYMBOLS = ["🍒", "🍋", "🍊", "🍇", "🔔", "💎", "7️⃣"];

  let balance = Number(localStorage.getItem(STORAGE_KEY));

  if (!Number.isFinite(balance) || balance < 0) {
    balance = STARTING_BALANCE;
  }

  /* -------------------------
     CORE
  ------------------------- */

  function save() {
    localStorage.setItem(STORAGE_KEY, String(balance));

    document.querySelectorAll("[data-balance]").forEach((element) => {
      element.textContent = format(balance);
    });
  }

  function format(value) {
    return Math.floor(value).toLocaleString();
  }

  function getBalance() {
    return balance;
  }

  function canBet(amount) {
    amount = Number(amount);
    return Number.isFinite(amount) &&
      amount > 0 &&
      amount <= balance;
  }

  function placeBet(amount) {
    amount = Math.floor(Number(amount));

    if (!canBet(amount)) {
      return false;
    }

    balance -= amount;
    save();

    return true;
  }

  function payout(amount) {
    amount = Math.max(0, Math.floor(Number(amount)));

    balance += amount;
    save();
  }

  function resetBalance() {
    balance = STARTING_BALANCE;
    save();
  }

  function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
  }

  function chance(probability) {
    return Math.random() < probability;
  }

  /* -------------------------
     UI HELPERS
  ------------------------- */

  function setResult(message, type = "") {
    const elements = document.querySelectorAll("[data-result]");

    elements.forEach((element) => {
      element.textContent = message;
      element.className = "result";

      if (type) {
        element.classList.add(type);
      }
    });
  }

  function setButtonLoading(button, loading) {
    if (!button) return;

    button.disabled = loading;

    if (loading) {
      button.dataset.originalText = button.textContent;
      button.textContent = "Spinning…";
    } else if (button.dataset.originalText) {
      button.textContent = button.dataset.originalText;
    }
  }

  /* -------------------------
     SLOTS
  ------------------------- */

  function spinSlots(bet) {
    bet = Math.floor(Number(bet));

    if (!placeBet(bet)) {
      setResult("Insufficient balance.", "lose");
      return;
    }

    const reels = [...document.querySelectorAll("[data-reel]")];

    if (reels.length < 3) {
      payout(bet);
      return;
    }

    reels.forEach((reel) => {
      reel.classList.add("spinning");
    });

    setResult("Good luck…");

    setTimeout(() => {
      const result = [
        SYMBOLS[random(0, SYMBOLS.length - 1)],
        SYMBOLS[random(0, SYMBOLS.length - 1)],
        SYMBOLS[random(0, SYMBOLS.length - 1)]
      ];

      reels.forEach((reel, index) => {
        reel.textContent = result[index];
        reel.classList.remove("spinning");
      });

      let multiplier = 0;

      if (
        result[0] === result[1] &&
        result[1] === result[2]
      ) {
        multiplier = result[0] === "7️⃣" ? 50 : 15;
      } else if (
        result[0] === result[1] ||
        result[1] === result[2] ||
        result[0] === result[2]
      ) {
        multiplier = 2;
      }

      const winnings = bet * multiplier;

      if (winnings > 0) {
        payout(winnings);

        setResult(
          `WIN! +${format(winnings)} credits`,
          "win"
        );
      } else {
        setResult("No match — try again.", "lose");
      }
    }, 900);
  }

  /* -------------------------
     ROULETTE
  ------------------------- */

  function spinRoulette(bet, selection) {
    bet = Math.floor(Number(bet));

    if (!placeBet(bet)) {
      setResult("Insufficient balance.", "lose");
      return;
    }

    const wheel = document.querySelector("[data-roulette-wheel]");

    if (wheel) {
      wheel.classList.remove("spinning");

      void wheel.offsetWidth;

      wheel.classList.add("spinning");
    }

    setResult("The wheel is spinning…");

    setTimeout(() => {
      const number = random(0, 36);

      let color = "black";

      if (number === 0) {
        color = "green";
      } else {
        const reds = [
          1, 3, 5, 7, 9, 12,
          14, 16, 18, 19, 21,
          23, 25, 27, 30, 32, 34, 36
        ];

        color = reds.includes(number) ? "red" : "black";
      }

      let won = false;
      let multiplier = 0;

      if (selection === String(number)) {
        won = true;
        multiplier = 35;
      } else if (selection === color) {
        won = true;
        multiplier = 2;
      }

      if (won) {
        const winnings = bet * multiplier;

        payout(winnings);

        setResult(
          `${number} ${color.toUpperCase()} — WIN +${format(winnings)}`,
          "win"
        );
      } else {
        setResult(
          `${number} ${color.toUpperCase()} — You lose.`,
          "lose"
        );
      }
    }, 4200);
  }

  /* -------------------------
     DICE
  ------------------------- */

  function rollDice(bet, target, direction) {
    bet = Math.floor(Number(bet));
    target = Number(target);

    if (!placeBet(bet)) {
      setResult("Insufficient balance.", "lose");
      return;
    }

    const roll = randomFloat(0, 100);

    let won = false;

    if (direction === "over") {
      won = roll > target;
    } else {
      won = roll < target;
    }

    if (won) {
      const probability = direction === "over"
        ? 100 - target
        : target;

      const multiplier = Math.max(
        1.01,
        0.97 * (100 / probability)
      );

      const winnings = Math.floor(bet * multiplier);

      payout(winnings);

      setResult(
        `Rolled ${roll.toFixed(2)} — WIN +${format(winnings)}`,
        "win"
      );
    } else {
      setResult(
        `Rolled ${roll.toFixed(2)} — You lose.`,
        "lose"
      );
    }
  }

  /* -------------------------
     CRASH
  ------------------------- */

  function generateCrashPoint() {
    const r = Math.random();

    if (r < 0.03) {
      return 1;
    }

    const value = 0.99 / (1 - r);

    return Math.max(
      1,
      Math.min(1000, value)
    );
  }

  function playCrash(bet, cashoutAt) {
    bet = Math.floor(Number(bet));
    cashoutAt = Number(cashoutAt);

    if (!placeBet(bet)) {
      setResult("Insufficient balance.", "lose");
      return;
    }

    const display = document.querySelector("[data-multiplier]");

    const crashPoint = generateCrashPoint();

    let multiplier = 1;

    setResult("Round started…");

    if (display) {
      display.classList.add("live");
    }

    const interval = setInterval(() => {
      multiplier *= 1.012;

      if (display) {
        display.textContent =
          `${multiplier.toFixed(2)}x`;
      }

      if (multiplier >= cashoutAt) {
        clearInterval(interval);

        const winnings = Math.floor(
          bet * cashoutAt
        );

        payout(winnings);

        if (display) {
          display.classList.remove("live");
        }

        setResult(
          `Cashed out at ${cashoutAt.toFixed(2)}x — +${format(winnings)}`,
          "win"
        );

        return;
      }

      if (multiplier >= crashPoint) {
        clearInterval(interval);

        if (display) {
          display.classList.remove("live");
          display.textContent =
            `${crashPoint.toFixed(2)}x`;
        }

        setResult(
          `CRASHED at ${crashPoint.toFixed(2)}x`,
          "lose"
        );
      }
    }, 80);
  }

  /* -------------------------
     BLACKJACK
  ------------------------- */

  const blackjack = {
    player: [],
    dealer: [],
    bet: 0,
    active: false
  };

  const deckValues = [
    "A", "2", "3", "4", "5", "6", "7",
    "8", "9", "10", "J", "Q", "K"
  ];

  function blackjackCard() {
    return deckValues[random(0, deckValues.length - 1)];
  }

  function blackjackValue(cards) {
    let total = 0;
    let aces = 0;

    cards.forEach((card) => {
      if (card === "A") {
        total += 11;
        aces++;
      } else if (
        card === "K" ||
        card === "Q" ||
        card === "J"
      ) {
        total += 10;
      } else {
        total += Number(card);
      }
    });

    while (total > 21 && aces > 0) {
      total -= 10;
      aces--;
    }

    return total;
  }

  function renderBlackjack() {
    const player = document.querySelector(
      "[data-player-cards]"
    );

    const dealer = document.querySelector(
      "[data-dealer-cards]"
    );

    if (player) {
      player.innerHTML = blackjack.player
        .map(card => `<div class="card">${card}</div>`)
        .join("");
    }

    if (dealer) {
      dealer.innerHTML = blackjack.dealer
        .map(card => `<div class="card">${card}</div>`)
        .join("");
    }

    const playerScore =
      document.querySelector("[data-player-score]");

    const dealerScore =
      document.querySelector("[data-dealer-score]");

    if (playerScore) {
      playerScore.textContent =
        blackjackValue(blackjack.player);
    }

    if (dealerScore && blackjack.active) {
      dealerScore.textContent =
        blackjackValue(blackjack.dealer);
    }
  }

  function startBlackjack(bet) {
    bet = Math.floor(Number(bet));

    if (!placeBet(bet)) {
      setResult("Insufficient balance.", "lose");
      return;
    }

    blackjack.player = [
      blackjackCard(),
      blackjackCard()
    ];

    blackjack.dealer = [
      blackjackCard(),
      blackjackCard()
    ];

    blackjack.bet = bet;
    blackjack.active = true;

    renderBlackjack();

    const playerTotal =
      blackjackValue(blackjack.player);

    if (playerTotal === 21) {
      blackjack.active = false;

      const winnings = bet * 2.5;

      payout(winnings);

      setResult(
        `BLACKJACK! +${format(winnings)}`,
        "win"
      );
    } else {
      setResult("Hit or stand.");
    }
  }

  function blackjackHit() {
    if (!blackjack.active) return;

    blackjack.player.push(blackjackCard());

    renderBlackjack();

    const total =
      blackjackValue(blackjack.player);

    if (total > 21) {
      blackjack.active = false;

      setResult(
        `Bust — ${total}`,
        "lose"
      );
    }
  }

  function blackjackStand() {
    if (!blackjack.active) return;

    while (
      blackjackValue(blackjack.dealer) < 17
    ) {
      blackjack.dealer.push(blackjackCard());
    }

    blackjack.active = false;

    renderBlackjack();

    const playerTotal =
      blackjackValue(blackjack.player);

    const dealerTotal =
      blackjackValue(blackjack.dealer);

    if (
      dealerTotal > 21 ||
      playerTotal > dealerTotal
    ) {
      const winnings = blackjack.bet * 2;

      payout(winnings);

      setResult(
        `You win! +${format(winnings)}`,
        "win"
      );
    } else if (playerTotal === dealerTotal) {
      payout(blackjack.bet);

      setResult(
        "Push — your bet was returned."
      );
    } else {
      setResult(
        `Dealer wins ${dealerTotal}–${playerTotal}`,
        "lose"
      );
    }
  }

  /* -------------------------
     MINES
  ------------------------- */

  function createMines(size = 25, mineCount = 5) {
    const mines = new Set();

    while (mines.size < mineCount) {
      mines.add(random(0, size - 1));
    }

    return mines;
  }

  /* -------------------------
     PLINKO
  ------------------------- */

  function plinko(bet, risk = "medium") {
    bet = Math.floor(Number(bet));

    if (!placeBet(bet)) {
      setResult("Insufficient balance.", "lose");
      return;
    }

    const multipliers = {
      low: [0.5, 0.8, 1, 1.2, 1.5],
      medium: [0.2, 0.5, 1, 2, 5],
      high: [0, 0.2, 1, 5, 15]
    };

    const table =
      multipliers[risk] || multipliers.medium;

    const multiplier =
      table[random(0, table.length - 1)];

    const winnings =
      Math.floor(bet * multiplier);

    if (winnings > 0) {
      payout(winnings);

      setResult(
        `${multiplier}x — +${format(winnings)}`,
        "win"
      );
    } else {
      setResult(
        "0x — Better luck next time.",
        "lose"
      );
    }

    return multiplier;
  }

  /* -------------------------
     BACCARAT
  ------------------------- */

  function baccarat(bet, selection) {
    bet = Math.floor(Number(bet));

    if (!placeBet(bet)) {
      setResult("Insufficient balance.", "lose");
      return;
    }

    const card = () =>
      random(0, 9);

    const player =
      (card() + card() + card()) % 10;

    const banker =
      (card() + card() + card()) % 10;

    let won = false;
    let multiplier = 0;

    if (
      selection === "player" &&
      player > banker
    ) {
      won = true;
      multiplier = 2;
    }

    if (
      selection === "banker" &&
      banker > player
    ) {
      won = true;
      multiplier = 1.95;
    }

    if (
      selection === "tie" &&
      banker === player
    ) {
      won = true;
      multiplier = 8;
    }

    if (won) {
      const winnings =
        Math.floor(bet * multiplier);

      payout(winnings);

      setResult(
        `Player ${player} — Banker ${banker} — WIN +${format(winnings)}`,
        "win"
      );
    } else if (player === banker) {
      payout(bet);

      setResult(
        `Tie ${player}–${banker} — Bet returned.`
      );
    } else {
      setResult(
        `Player ${player} — Banker ${banker}`,
        "lose"
      );
    }
  }

  /* -------------------------
     PUBLIC API
  ------------------------- */

  window.DexFansCasino = {
    getBalance,
    resetBalance,
    placeBet,
    payout,
    save,

    spinSlots,
    spinRoulette,
    rollDice,
    playCrash,

    startBlackjack,
    blackjackHit,
    blackjackStand,

    createMines,
    plinko,
    baccarat,

    random,
    randomFloat,
    chance,
    format,
    setResult
  };

  /* Initial balance display */
  document.addEventListener("DOMContentLoaded", save);
})();