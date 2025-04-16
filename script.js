const margin = document.getElementById("margin");
const leverage = document.getElementById("leverage");
const position = document.getElementById("position");
const entryPrice = document.getElementById("entryPrice");
const profitRate = document.getElementById("profitRate");
const lossRate = document.getElementById("lossRate");
const takeProfitPrice = document.getElementById("takeProfitPrice");
const stopLossPrice = document.getElementById("stopLossPrice");
const feeRate = document.getElementById("feeRate");
const feeMultiplier = document.getElementById("feeMultiplier");
const takeProfitInfo = document.getElementById("takeProfitInfo");
const stopLossInfo = document.getElementById("stopLossInfo");
const rrr = document.getElementById("rrr");

const longBtn = document.getElementById("longBtn");
const shortBtn = document.getElementById("shortBtn");
let isLong = true;

function toggleMode(long) {
  isLong = long;
  longBtn.classList.toggle("active", long);
  shortBtn.classList.toggle("active", !long);
  calculateResults();
}

longBtn.onclick = () => toggleMode(true);
shortBtn.onclick = () => toggleMode(false);

function updatePositionFromMargin() {
  const m = parseFloat(margin.value);
  const l = parseFloat(leverage.value);
  if (!isNaN(m) && !isNaN(l)) {
    position.value = (m * l).toFixed(2);
  }
}

function updateMarginFromPosition() {
  const p = parseFloat(position.value);
  const l = parseFloat(leverage.value);
  if (!isNaN(p) && !isNaN(l) && l !== 0) {
    margin.value = (p / l).toFixed(2);
  }
}

function calculateResults() {
  const m = parseFloat(margin.value);
  const l = parseFloat(leverage.value);
  const pos = parseFloat(position.value);
  const ePrice = parseFloat(entryPrice.value);
  const pRate = parseFloat(profitRate.value) / 100;
  const lRate = parseFloat(lossRate.value) / 100;
  const fRate = parseFloat(feeRate.value) / 100;
  const fMult = parseInt(feeMultiplier.value);

  if (isNaN(m) || isNaN(l) || isNaN(pos) || isNaN(ePrice)) return;

  const targetNetProfit = m * pRate;
  let tp = ePrice;
  let i = 0;
  while (i < 1000) {
    const gross = ((isLong ? tp - ePrice : ePrice - tp) / ePrice) * pos;
    const fee = fMult === 2
      ? pos * fRate + (pos * (tp / ePrice)) * fRate
      : pos * fRate;
    const net = gross - fee;
    if (Math.abs(net - targetNetProfit) < 0.01) break;
    tp += ((targetNetProfit - net) / pos) * ePrice * (isLong ? 1 : -1);
    i++;
  }
  takeProfitPrice.value = tp.toFixed(2);
  const tpFee = fMult === 2 ? pos * fRate + (pos * (tp / ePrice)) * fRate : pos * fRate;
  const tpProfit = ((isLong ? tp - ePrice : ePrice - tp) / ePrice) * pos;
  takeProfitInfo.innerText = `止盈收益: ${(tpProfit - tpFee).toFixed(2)} USDT, 手续费: ${tpFee.toFixed(2)} USDT`;

  const slLoss = m * lRate;
  const sl = isLong ? ePrice - (slLoss / pos) * ePrice : ePrice + (slLoss / pos) * ePrice;
  stopLossPrice.value = sl.toFixed(2);
  const slFee = fMult === 2 ? pos * fRate + (pos * (sl / ePrice)) * fRate : pos * fRate;
  const slLossAmt = ((isLong ? ePrice - sl : sl - ePrice) / ePrice) * pos;
  stopLossInfo.innerText = `止损亏损: ${(slLossAmt + slFee).toFixed(2)} USDT, 手续费: ${slFee.toFixed(2)} USDT`;

  const netProfit = tpProfit - tpFee;
  const netLoss = slLossAmt + slFee;
  rrr.innerText = netLoss > 0 ? (netProfit / netLoss).toFixed(2) : "--";
}

[margin, leverage].forEach(el => el.addEventListener("input", updatePositionFromMargin));
position.addEventListener("input", updateMarginFromPosition);
document.querySelectorAll("input, select").forEach(el => {
  el.addEventListener("input", () => {
    updatePositionFromMargin();
    calculateResults();
  });
});

fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT")
  .then(res => res.json())
  .then(data => {
    entryPrice.value = parseFloat(data.price).toFixed(2);
    updatePositionFromMargin();
    calculateResults();
  });
}