const { jsPDF } = window.jspdf;

console.log("character.js loaded")

document.addEventListener("DOMContentLoaded", () => {
    setupEventListeners();
    loadSavedList();
    loadAutoSave();
    restoreTheme();
});

function setupEventListeners() {
    const inputs = document.querySelectorAll("input, textarea, select");
    inputs.forEach(el => {
        el.addEventListener("input", saveCharacter);
    });

    document.getElementById("save").addEventListener("click", saveCharacter);
    document.getElementById("pdf").addEventListener("click", generatePDF);
}

const nameInput = document.getElementById("name");
const conceptInput = document.getElementById("concept");
const skillInput = document.getElementById("skill");

const statInput = document.getElementById("stat-value");

const personalityInput = document.getElementById("personality");
const backgroundInput = document.getElementById("background");
const inventoryInput = document.getElementById("inventory");

const saveBtn = document.getElementById("save");
const loadBtn = document.getElementById("load");
const deleteBtn = document.getElementById("delete");
const exportBtn = document.getElementById("export");
const importBtn = document.getElementById("import");
const fileInput = document.getElementById("file-input");
const pdfBtn = document.getElementById("pdf");
const themeToggle = document.getElementById("theme-toggle");
const savedCharacters = document.getElementById("saved-characters");

let unsavedChanges = false;
let totalPoints = 10;
let availablePoints = 10;
const pointsRemaining = document.getElementById("points-remaining");
const newCharBtn = document.getElementById("new");
const toastContainer = document.getElementById("toast-container");


function setupEventListeners() {
    document.querySelectorAll("input, textarea").forEach(el => {
        el.addEventListener("input", () => {
            unsavedChanges = true;
            autosave();
        });
    });

    document.querySelectorAll(".increase").forEach(btn => {
        btn.addEventListener("click", e => {
            const input = e.target.parentElement.querySelector(".stat-value");
            let value = parseInt(input.value);
            if (availablePoints > 0 && value < 30) {
                input.value = value + 1;
                availablePoints--;
                updatePointsDisplay();
                input.dispatchEvent(new Event("input"));
            } else {
                showToast("No points remaining", "warning");
            }
        });
    });

    document.querySelectorAll(".decrease").forEach(btn => {
        btn.addEventListener("click", e => {
            const input = e.target.parentElement.querySelector(".stat-value");
            let value = parseInt(input.value);
            if (value > 10) {
                input.value = value - 1;
                availablePoints++;
                updatePointsDisplay
                input.dispatchEvent(new Event("input"));
            }
        });
    });

    function updatePointsDisplay () {
        pointsRemaining.textContent = `Points Remaining: ${availablePoints}`;
    }

    newCharBtn.addEventListener("click", newCharacter);
    saveBtn.addEventListener("click", saveCharacter);
    loadBtn.addEventListener("click", loadCharacter);
    deleteBtn.addEventListener("click", deleteCharacter);
    exportBtn.addEventListener("click", exportJSON);
    importBtn.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", importJSON);
    pdfBtn.addEventListener("click", generatePDF);
    themeToggle.addEventListener("click", toggleTheme);

    window.addEventListener("beforeunload", e => {
        if (unsavedChanges) {
            e.preventDefault();
            e.returnValue = "";
        }
    });
}

function getCurrentCharacter() {
    const stats = {};
    document.querySelectorAll(".stat").forEach(stat => {
        const name = stat.getAttribute("data-stat");
        const value = stat.querySelector(".stat-value").value;
        stats[name] = value;
    });

    return {
        name: nameInput.value.trim() || "unnamed",
        concept: conceptInput.value,
        skill: skillInput.value,
        stats,
        personality: personalityInput.value,
        background: backgroundInput.value,
        inventory: inventoryInput.value
    };
}

function setCharacter(data) {
    nameInput.value = data.name || "";
    conceptInput.value = data.concept || "";
    skillInput.value = data.skill || "";

    document.querySelectorAll(".stat").forEach(stat => {
        const key = stat.getAttribute("data-stat");
        if (data.stats && data.stats[key]) {
            stat.querySelector(".stat-value").value = data.stats[key];
        }
    });

    personalityInput.value = data.personality || "";
    backgroundInput.value = data.background || "";
    inventoryInput.value = data.inventory || "";
}

function newCharacter() {
    nameInput.value = "";
    conceptInput.Value = "";
    personalityInput.value = "";
    backgroundInput.value = "";
    inventoryInput.value = "";

    document.querySelectorAll(".stat-value").forEach(input => input.value = 10);

    availablePoints = totalPoints = 10;
    updatePointsDisplay();
    showToast("New character created!", "success")
}

function saveCharacter() {
    const charData = getCurrentCharacter();
    localStorage.setItem(`char_${charData.name}`, JSON.stringify(charData));
    loadSavedList();
    unsavedChanges = false;
    showToast(`Saved "${charData.name}"`, "success");
}

function loadCharacter() {
    const name =savedCharacters.value;
    if (!name) return;
    const data = JSON.parse(localStorage.getItem(`char_${name}`));
    if (data) setCharacter(data);
    unsavedChanges = false;
}

function deleteCharacter() {
    const name = savedCharacters.value;
    if (!name) return;
    localStorage.removeItem(`char_${name}`);
    loadSavedList();
    showToast(`Deleted "${name}"`, "error");
}

function loadSavedList() {
    savedCharacters.innerHTML = "<option value= ''>--Saved Characters--</option>";
    for (let key in localStorage) {
        if (key.startsWith("char_")) {
            const name = key.replace("char_", "");
            const option = document.createElement("option");
            option.value = name;
            option.textContent = name;
            savedCharacters.appendChild(option);
        }
    }
}

function autosave() {
    const data = getCurrentCharacter();
    localStorage.setItem("autosave", JSON.stringify(data));
}

function loadAutoSave() {
    const data = JSON.parse(localStorage.getItem("autosave"));
    if (data) setCharacter(data);
}

function exportJSON() {
    const charData = getCurrentCharacter();
    const blob = new Blob([JSON.stringify(charData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${charData.name}_Character.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importJSON(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
        const data = JSON.parse(event.target.result);
        setCharacter(data);
        autosave();
    };
    reader.readAsText(file);
}

function generatePDF() {
    const char = getCurrentCharacter();
    const doc = new jsPDF();

    let y = 20;
    doc.setFont("times", "bold");
    doc.setFontSize(18);
    doc.text(char.name, 105, y, { align: "center" });
    y += 10;

    doc.setFontSize(12);
    doc.text(`Concept / Role: ${char.concept}`, 20, y);
    y += 6;
    doc.text(`Main Skill: ${char.skill}`, 20, y);
    y += 10;

    doc.setFont("times", "normal");
    doc.rect(15, y, 180, 60);
    const statNames = Object.keys(char.stats);
    statNames.forEach((s, i) => {
        const sy = y + 10 + i * 9;
        doc.text(`${s.padEnd(13)}: ${char.stats[s]}`, 25, sy);
    });

    y += 70;

    drawTextBox(doc, "Personality", char.personality, y);
    y += 40;

    drawTextBox(doc, "Background", char.background, y);
    y += 40;

    drawTextBox(doc, "Inventory", char.inventory, y);

    doc.save(`${char.name}_CharacterSheet.pdf`);
}

function drawTextBox(doc, title, text, y) {
    doc.rect(15, y, 180, 35);
    doc.setFont("times", "bold");
    doc.text(`${title}:`, 20, y + 8);
    doc.setFont("times", "normal");
    doc.text(doc.splitTextToSize(text || "", 170), 25, y + 14);
}

function toggleTheme() {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
}

if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
}

function restoreTheme() {
    const theme = localStorage.getItem("theme");
    if (theme === "dark") {
        document.body.classList.add("dark");
    } else {
        document.body.classList.remove("dark");
    }
}

function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.classList.add("toast");
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.classList.add("show"), 100);
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 400);
    }, 2500);
}
