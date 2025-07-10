const grid = document.getElementById("grid");
const submitBtn = document.getElementById("submitBtn");
const retryBtn = document.getElementById("retryBtn");
const result = document.getElementById("result");
const check = document.getElementById("robotCheck");
const loading = document.getElementById("loading");
let currentImage = "";
check.addEventListener("change", async () => {
  if (check.checked) {
    document.querySelector('.instruction').style.display = "block";
    loading.style.display = "block"; // 로딩 시작 표시

    const res = await fetch("/generate");
    const data = await res.json();

    if (data.status === "success") {
      currentImage = data.image;


      const instructionText = {
        "4.jpg": "⛵ 종이배를 찾으시오",
        "6.jpg": "🕒 시계를 찾으시오",
        "7.jpg": "🦢 거위를 찾으시오"
      };
      document.querySelector('.instruction').innerText = instructionText[currentImage] || "숨겨진 사물을 찾으시오";
      document.querySelector('.instruction').style.display = "block";
      
      loadGrid();
      loading.style.display = "none"; // ✅ 로딩 완료 시 숨기기
      grid.style.display = "grid";
      submitBtn.style.display = "inline-block";
    }
  }
});

function loadGrid() {
  grid.innerHTML = "";
  for (let i = 0; i < 16; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    const row = Math.floor(i / 4);
    const col = i % 4;
    cell.dataset.key = `${row}_${col}`;
    cell.style.backgroundImage = `url("/get_image/${currentImage}")`;  // ✅ 이 줄 추가!
    cell.style.backgroundPosition = `-${col * 128}px -${row * 128}px`;
    cell.onclick = () => cell.classList.toggle("selected");
    grid.appendChild(cell);
  }
}

submitBtn.onclick = async () => {
  const selected = Array.from(document.querySelectorAll(".cell.selected")).map(c => c.dataset.key);
  const res = await fetch("/check", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ selected })
  });
  const data = await res.json();
  if (data.result === "success") {
    result.innerText = "✅ Verification passed!";
    grid.style.display = "none";
    submitBtn.style.display = "none";
    retryBtn.style.display = "none";
    check.parentElement.style.display = "none";
    document.querySelector('.instruction').style.display = "none";
  } else {
    result.innerText = "❌ Please try again.";
    retryBtn.style.display = "inline-block";
    grid.style.display = "none";
    submitBtn.style.display = "none";
  }
};

retryBtn.onclick = () => window.location.reload();
