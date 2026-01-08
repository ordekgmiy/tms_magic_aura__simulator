// 隨機依權重抽一個潛能
function weightedRandom(pool, line) {
  const weights = pool.map(p => p.prob[line] || 0);
  const total = weights.reduce((a, b) => a + b, 0);
  let rand = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    rand -= weights[i];
    if (rand <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

// 計算潛能對魔攻的等效加成
function potentialToMa(p, maToInt, maToAll) {
  if (p.type === "flat") return p.ma;
  if (p.type === "all") return p.ma / maToAll;
  if (p.type === "int") return p.ma / maToInt;
  return 0;
}

// 計算統計數據
function calcStats(values) {
  values.sort((a, b) => a - b);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const mid = values[Math.floor(values.length / 2)];
  const std = Math.sqrt(values.map(x => (x - avg) ** 2).reduce((a, b) => a + b, 0) / values.length);
  const p90 = values[Math.floor(values.length * 0.9)];
  const p99 = values[Math.floor(values.length * 0.99)];

  return {
    avg: avg.toFixed(2),
    std: std.toFixed(2),
    mid: mid.toFixed(2),
    p90: p90.toFixed(2),
    p99: p99.toFixed(2),
    sorted: values
  };
}

// 百分位函式
function percentile(values, p) {
  if (values.length === 0) return NaN;
  const rank = p * (values.length - 1);
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);
  if (lower === upper) return values[lower];
  return values[lower] + (values[upper] - values[lower]) * (rank - lower);
}

// 主模擬函式
function simulate() {
  const targetMa = parseFloat(document.getElementById("targetMa").value);
  const maToInt = parseFloat(document.getElementById("maToInt").value);
  const maToAll = parseFloat(document.getElementById("maToAll").value);
  const successCountTarget = parseInt(document.getElementById("simCount").value);
  const type = document.getElementById("potentialType").value;

  let pool;
  if (type === "epic") {
    pool = epicPool;
  } else if (type === "special") {
    pool = specialPool;
  } else if (type === "legend") {
    pool = legendPool;
  } else {
    pool = rarePool;
  }

  let successAttempts = [];   // 每次成功花費嘗試次數
  let successMaValues = [];   // 每次成功的等效魔攻
  let logLines = [];

  for (let success = 1; success <= successCountTarget; success++) {
    let attempts = 0;
    let totalMa = 0;
    let line1, line2, line3;

    // 無限迴圈直到成功
    while (true) {
      attempts++;

      line1 = weightedRandom(pool, 0);
      line2 = weightedRandom(pool, 1);
      line3 = weightedRandom(pool, 2);

      totalMa =
        potentialToMa(line1, maToInt, maToAll) +
        potentialToMa(line2, maToInt, maToAll) +
        potentialToMa(line3, maToInt, maToAll);

      if (totalMa >= targetMa) {
        successAttempts.push(attempts);
        successMaValues.push(totalMa);

        if (logLines.length < 50) {
          logLines.push(
            `第 ${success} 次成功 (嘗試次數: ${attempts}) 潛能 (等效 魔攻: ${totalMa.toFixed(2)})\n` +
            `  - ${line1.name}\n  - ${line2.name}\n  - ${line3.name}`
          );
        }
        break; // 成功後跳出迴圈
      }
    }
  }

  const attemptStats = calcStats(successAttempts);
  const outputStats = calcStats(successMaValues);

  // 指定百分位數
  let percentileLines = [];
  //const percentiles = [0, 0.25, 0.5, 0.75, 0.9, 0.95, 0.99];
  //percentiles.forEach(p => {
    //const rank = p * (outputStats.sorted.length - 1);
    //const low = Math.floor(rank), high = Math.ceil(rank);
    //const val = (low === high) ? outputStats.sorted[low] : outputStats.sorted[low] + (outputStats.sorted[high] - outputStats.sorted[low]) * (rank - low);
    //percentileLines.push(`${(p * 100).toFixed(0)}% 百分位：${val.toFixed(2)}`);
  //});

  // 顯示結果，等效魔攻統計放最上面
  document.getElementById("statistics").innerText =
    `🔥【成功成品 等效魔攻 統計】🔥\n` +
    `平均：${outputStats.avg}\n` +
    `中位數：${outputStats.mid}\n` +
    `標準差：${outputStats.std}\n` +
    //`90%：${outputStats.p90}\n` +
    //`99%：${outputStats.p99}\n\n` +

    //`成功次數：${successCountTarget}\n` +
    //`總嘗試次數：${successAttempts.reduce((a, b) => a + b, 0)}\n\n` +

    `\n【每次成功花費嘗試次數】\n` +
    `平均：${attemptStats.avg}\n` +
    `中位數：${attemptStats.mid}\n` +
    `標準差：${attemptStats.std}\n` +
    percentileLines.join("\n");

  document.getElementById("output").innerText =
    `成功的前 50 組模擬結果：\n\n` + (logLines.length > 0 ? logLines.join('\n\n') : "無成功案例");
}

// 按鈕綁定事件
document.getElementById("startSimBtn").addEventListener("click", simulate);
