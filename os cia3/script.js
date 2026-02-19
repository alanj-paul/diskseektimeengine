let chart = null;
let isAnimating = false;

/* =========================
   INPUT GENERATION
========================= */

function generateInputs() {
    const count = parseInt(document.getElementById("count").value);
    const container = document.getElementById("request-boxes");
    container.innerHTML = "";

    if (!count || count <= 0) return;

    for (let i = 0; i < count; i++) {
        const input = document.createElement("input");
        input.type = "number";
        input.className = "request-input";
        input.placeholder = "R" + (i + 1);
        input.style.margin = "10px";
        container.appendChild(input);
    }
}

/* =========================
   GET REQUESTS (STRICT VALIDATION)
========================= */

function getRequests() {

    const maxTrack = parseInt(document.getElementById("maxTrack").value);
    const inputs = Array.from(document.querySelectorAll(".request-input"));

    let requests = [];

    for (let input of inputs) {

        const value = parseInt(input.value);

        if (isNaN(value)) continue;

        if (value < 0 || value > maxTrack) {
            alert("Request track must be between 0 and " + maxTrack);
            return null;
        }

        requests.push(value);
    }

    return requests;
}

/* =========================
   SEEK TIME
========================= */

function calculateSeekTime(sequence) {
    let total = 0;
    for (let i = 0; i < sequence.length - 1; i++) {
        total += Math.abs(sequence[i] - sequence[i + 1]);
    }
    return total;
}

/* =========================
   ALGORITHMS
========================= */

function fcfs(req, head) {
    return [head, ...req];
}

function sstf(req, head) {
    let requests = [...req];
    let sequence = [head];

    while (requests.length > 0) {
        requests.sort((a, b) => Math.abs(a - head) - Math.abs(b - head));
        head = requests.shift();
        sequence.push(head);
    }
    return sequence;
}

function scan(req, head, dir, maxTrack) {
    let left = req.filter(r => r < head).sort((a, b) => a - b);
    let right = req.filter(r => r >= head).sort((a, b) => a - b);

    let sequence = [head];

    if (dir === "Right") {
        sequence.push(...right);
        if (left.length > 0) {
            sequence.push(maxTrack);
            sequence.push(...left.reverse());
        }
    } else {
        sequence.push(...left.reverse());
        if (right.length > 0) {
            sequence.push(0);
            sequence.push(...right);
        }
    }

    return sequence;
}

function cscan(req, head, dir, maxTrack) {
    let left = req.filter(r => r < head).sort((a, b) => a - b);
    let right = req.filter(r => r >= head).sort((a, b) => a - b);

    let sequence = [head];

    if (dir === "Right") {
        sequence.push(...right);
        if (left.length > 0) {
            sequence.push(maxTrack);
            sequence.push(0);
            sequence.push(...left);
        }
    } else {
        sequence.push(...left.reverse());
        if (right.length > 0) {
            sequence.push(0);
            sequence.push(maxTrack);
            sequence.push(...right.reverse());
        }
    }

    return sequence;
}

function look(req, head, dir) {
    let left = req.filter(r => r < head).sort((a, b) => a - b);
    let right = req.filter(r => r >= head).sort((a, b) => a - b);

    return dir === "Right"
        ? [head, ...right, ...left.reverse()]
        : [head, ...left.reverse(), ...right];
}

function clook(req, head, dir) {
    let left = req.filter(r => r < head).sort((a, b) => a - b);
    let right = req.filter(r => r >= head).sort((a, b) => a - b);

    return dir === "Right"
        ? [head, ...right, ...left]
        : [head, ...left.reverse(), ...right.reverse()];
}

/* =========================
   RUN SINGLE SIMULATION
========================= */

async function runSingle() {

    if (isAnimating) return;

    const head = parseInt(document.getElementById("head").value);
    const dir = document.getElementById("direction").value;
    const maxTrack = parseInt(document.getElementById("maxTrack").value);
    const speed = parseInt(document.getElementById("speed").value);
    const algo = document.getElementById("algorithm").value;
    const req = getRequests();

    if (!req) return;

    document.getElementById("flowText").innerText = "Initializing simulation...";

    if (isNaN(head) || isNaN(maxTrack) || req.length === 0) {
        alert("Please enter valid inputs.");
        document.getElementById("flowText").innerText = "Waiting for simulation...";
        return;
    }

    if (head < 0 || head > maxTrack) {
        alert("Head position must be between 0 and " + maxTrack);
        document.getElementById("flowText").innerText = "Waiting for simulation...";
        return;
    }

    let sequence;

    switch (algo) {
        case "FCFS": sequence = fcfs(req, head); break;
        case "SSTF": sequence = sstf(req, head); break;
        case "SCAN": sequence = scan(req, head, dir, maxTrack); break;
        case "C-SCAN": sequence = cscan(req, head, dir, maxTrack); break;
        case "LOOK": sequence = look(req, head, dir); break;
        case "C-LOOK": sequence = clook(req, head, dir); break;
    }

    document.getElementById("chart").scrollIntoView({ behavior: "smooth" });

    await animateGraph(sequence, speed);
    updateDashboard(sequence);
}

/* =========================
   RUN COMPARISON
========================= */

function runCompare() {

    if (isAnimating) return;

    const head = parseInt(document.getElementById("head").value);
    const dir = document.getElementById("direction").value;
    const maxTrack = parseInt(document.getElementById("maxTrack").value);
    const req = getRequests();

    if (!req) return;

    document.getElementById("flowText").innerText = "Running comparison...";

    if (isNaN(head) || isNaN(maxTrack) || req.length === 0) {
        alert("Please enter valid inputs.");
        document.getElementById("flowText").innerText = "Waiting for simulation...";
        return;
    }

    if (head < 0 || head > maxTrack) {
        alert("Head position must be between 0 and " + maxTrack);
        document.getElementById("flowText").innerText = "Waiting for simulation...";
        return;
    }

    const results = {
        FCFS: calculateSeekTime(fcfs(req, head)),
        SSTF: calculateSeekTime(sstf(req, head)),
        SCAN: calculateSeekTime(scan(req, head, dir, maxTrack)),
        "C-SCAN": calculateSeekTime(cscan(req, head, dir, maxTrack)),
        LOOK: calculateSeekTime(look(req, head, dir)),
        "C-LOOK": calculateSeekTime(clook(req, head, dir))
    };

    document.getElementById("chart").scrollIntoView({ behavior: "smooth" });

    drawBarChart(results);

    const best = Object.keys(results)
        .reduce((a, b) => results[a] < results[b] ? a : b);

    document.getElementById("bestAlgo").innerText = best;
    document.getElementById("flowText").innerText = "Comparison complete.";
}

/* =========================
   LINE GRAPH (NO BORDER)
========================= */

async function animateGraph(sequence, speed) {

    isAnimating = true;

    const maxTrack = parseInt(document.getElementById("maxTrack").value);
    const ctx = document.getElementById("chart").getContext("2d");

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: "line",
        data: {
            datasets: [{
                label: "Head Movement",
                data: [],
                borderColor: "#00f5ff",
                borderWidth: 3,
                tension: 0,
                pointRadius: 4
            }]
        },
        options: {
            animation: false,
            scales: {
                x: {
                    type: "linear",
                    min: 0,
                    max: maxTrack,
                    ticks: { color: "#ffffff" },
                    grid: {
                        color: "rgba(0,245,255,0.35)",
                        drawBorder: false
                    }
                },
                y: {
                    ticks: { color: "#00f5ff" },
                    grid: {
                        color: "rgba(0,245,255,0.25)",
                        drawBorder: false
                    }
                }
            }
        }
    });

    let runningSeek = 0;

    for (let i = 0; i < sequence.length; i++) {

        chart.data.datasets[0].data.push({ x: sequence[i], y: i });
        chart.update();

        if (i > 0) {
            runningSeek += Math.abs(sequence[i] - sequence[i - 1]);
        }

        document.getElementById("flowText").innerText =
            i > 0
                ? `Moving ${sequence[i - 1]} → ${sequence[i]}`
                : `Starting at ${sequence[i]}`;

        document.getElementById("totalSeek").innerText = runningSeek;
        document.getElementById("steps").innerText = i;

        await new Promise(resolve => setTimeout(resolve, speed));
    }

    isAnimating = false;
}

/* =========================
   BAR GRAPH (NO BORDER)
========================= */

function drawBarChart(data) {

    const canvas = document.getElementById("chart");
    const ctx = canvas.getContext("2d");

    // Add glow to canvas itself
    canvas.style.boxShadow = "0 0 25px rgba(180, 0, 255, 0.5)";
    canvas.style.borderRadius = "12px";

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: Object.keys(data),
            datasets: [{
                label: "Total Seek Time",
                data: Object.values(data),
                backgroundColor: "rgba(148, 0, 211, 0.85)",
                borderWidth: 0,
                hoverBackgroundColor: "rgba(200, 100, 255, 1)"
            }]
        },
        options: {
            plugins: {
                legend: {
                    labels: {
                        color: "#e0aaff",
                        font: { weight: "bold", size: 14 }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: "#e0aaff",
                        font: { weight: "bold" }
                    },
                    grid: {
                        color: "rgba(199,125,255,0.35)",
                        drawBorder: false
                    }
                },
                y: {
                    ticks: {
                        color: "#e0aaff",
                        font: { weight: "bold" }
                    },
                    grid: {
                        color: "rgba(199,125,255,0.25)",
                        drawBorder: false
                    }
                }
            }
        }
    });
}


/* =========================
   DASHBOARD
========================= */

function updateDashboard(sequence) {
    const total = calculateSeekTime(sequence);
    const avg = (total / (sequence.length - 1)).toFixed(2);

    document.getElementById("totalSeek").innerText = total;
    document.getElementById("avgSeek").innerText = avg;
    document.getElementById("steps").innerText = sequence.length - 1;
}

/* =========================
   RESET
========================= */

function resetApp() {
    if (chart) chart.destroy();

    document.getElementById("totalSeek").innerText = 0;
    document.getElementById("avgSeek").innerText = 0;
    document.getElementById("steps").innerText = 0;
    document.getElementById("bestAlgo").innerText = "--";
    document.getElementById("flowText").innerText = "Waiting for simulation...";

    isAnimating = false;
}
