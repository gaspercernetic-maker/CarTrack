const state = {
    unpaidKm: Number(localStorage.getItem("unpaidKm")) || 0,
    fuelConsumption: Number(localStorage.getItem("fuelConsumption")) || 0,
    fuelPrice: Number(localStorage.getItem("fuelPrice")) || 0,
    costPerKm: Number(localStorage.getItem("costPerKm")) || 0,
    payments: JSON.parse(localStorage.getItem("payments") || "[]"),
    refuels: JSON.parse(localStorage.getItem("refuels") || "[]")
};

const debtElement = document.querySelector(".debt");
const kmElement = document.querySelector(".km .stat-value");
const fuelElement = document.querySelector(".fuel .stat-value");
const addKmButton = document.querySelector(".action.blue");
const refuelButton = document.querySelector(".action.green");
const payButton = document.querySelector(".action.purple");
const historyList = document.querySelector("#history-list");
const settingsFuelPrice = document.querySelector("#settings-fuel-price");
const resetDataButton = document.querySelector("#reset-data");
const navButtons = document.querySelectorAll(".nav button");
const screens = {
    home: document.querySelector("#home-screen"),
    history: document.querySelector("#history-screen"),
    settings: document.querySelector("#settings-screen")
};

function saveState() {
    localStorage.setItem("unpaidKm", state.unpaidKm);
    localStorage.setItem("fuelConsumption", state.fuelConsumption);
    localStorage.setItem("fuelPrice", state.fuelPrice);
    localStorage.setItem("costPerKm", state.costPerKm);
    localStorage.setItem("payments", JSON.stringify(state.payments));
    localStorage.setItem("refuels", JSON.stringify(state.refuels));
}

function formatEuro(amount) {
    return `${Number(amount).toFixed(2).replace(".", ",")} €`;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("sl-SI", {
        day: "numeric",
        month: "numeric",
        year: "numeric"
    });
}

function updateHome() {
    if (!debtElement || !kmElement || !fuelElement) return;

    const debt = state.unpaidKm * state.costPerKm;
    debtElement.textContent = formatEuro(debt);
    kmElement.textContent = `${Number(state.unpaidKm.toFixed(2))} km`;
    fuelElement.textContent = state.fuelConsumption > 0
        ? `${state.fuelConsumption.toFixed(2).replace(".", ",")} L/100 km`
        : "0,0 L/100 km";
}

function updateSettings() {
    if (!settingsFuelPrice) return;
    settingsFuelPrice.textContent = state.fuelPrice > 0
        ? `${state.fuelPrice.toFixed(2).replace(".", ",")} €/L`
        : "0,00 €/L";
}

function renderHistory() {
    if (!historyList) return;

    const events = [
        ...state.payments.map(item => ({ type: "payment", date: item.date, item })),
        ...state.refuels.map(item => ({ type: "refuel", date: item.date, item }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    if (events.length === 0) {
        historyList.innerHTML = `<div class="history-empty">Še ni nobene zgodovine.</div>`;
        return;
    }

    historyList.innerHTML = events.map(event => {
        if (event.type === "payment") {
            return `
                <div class="history-item">
                    <div class="history-main">
                        <div class="history-name">💳 Plačilo</div>
                        <div class="history-details">${formatDate(event.date)} · ${event.item.km} km</div>
                    </div>
                    <div class="history-amount payment">-${formatEuro(event.item.amount)}</div>
                </div>
            `;
        }

        return `
            <div class="history-item">
                <div class="history-main">
                    <div class="history-name">⛽ Tankanje</div>
                    <div class="history-details">${formatDate(event.date)} · ${event.item.km} km · ${event.item.litres} L · ${event.item.consumption.toFixed(2).replace(".", ",")} L/100 km</div>
                </div>
                <div class="history-amount refuel">${formatEuro(event.item.litres * event.item.price)}</div>
            </div>
        `;
    }).join("");
}

function showScreen(screenName) {
    if (!screens.home || !screens.history || !screens.settings) return;

    Object.values(screens).forEach(screen => screen.classList.add("hidden"));
    screens[screenName].classList.remove("hidden");

    navButtons.forEach(button => button.classList.remove("active"));
    const activeIndex = { home: 0, history: 1, settings: 2 }[screenName];
    if (navButtons[activeIndex]) navButtons[activeIndex].classList.add("active");

    if (screenName === "history") renderHistory();
    if (screenName === "settings") updateSettings();
}

if (addKmButton) {
    addKmButton.addEventListener("click", () => {
        const input = prompt("Koliko kilometrov želiš dodati?");
        if (input === null) return;

        const km = Number(input.replace(",", "."));
        if (!Number.isFinite(km) || km <= 0) {
            alert("Vnesi veljavno število kilometrov.");
            return;
        }

        state.unpaidKm += km;
        saveState();
        updateHome();
    });
}

if (refuelButton) {
    refuelButton.addEventListener("click", () => {
        const kmInput = prompt("Koliko km si naredil od prejšnjega tankanja?");
        if (kmInput === null) return;

        const litresInput = prompt("Koliko litrov si natočil?");
        if (litresInput === null) return;

        const priceInput = prompt("Koliko € na liter si plačal?");
        if (priceInput === null) return;

        const km = Number(kmInput.replace(",", "."));
        const litres = Number(litresInput.replace(",", "."));
        const price = Number(priceInput.replace(",", "."));

        if (!Number.isFinite(km) || km <= 0 || !Number.isFinite(litres) || litres <= 0 || !Number.isFinite(price) || price <= 0) {
            alert("Vnesi veljavne vrednosti za km, litre in ceno.");
            return;
        }

        state.fuelConsumption = (litres / km) * 100;
        state.fuelPrice = price;
        state.costPerKm = (state.fuelConsumption * price) / 100;

        state.refuels.unshift({
            date: new Date().toISOString(),
            km,
            litres,
            price,
            consumption: state.fuelConsumption,
            costPerKm: state.costPerKm
        });

        saveState();
        updateHome();
    });
}

if (payButton) {
    payButton.addEventListener("click", () => {
        if (state.unpaidKm <= 0) {
            alert("Trenutno nimaš nobenega dolga.");
            return;
        }

        const debt = state.unpaidKm * state.costPerKm;
        const confirmed = confirm(`Plačaš ${state.unpaidKm} km oziroma ${formatEuro(debt)}?`);
        if (!confirmed) return;

        state.payments.unshift({
            date: new Date().toISOString(),
            km: state.unpaidKm,
            amount: debt
        });

        state.unpaidKm = 0;
        saveState();
        updateHome();
    });
}

if (navButtons.length >= 3) {
    navButtons[0].addEventListener("click", () => showScreen("home"));
    navButtons[1].addEventListener("click", () => showScreen("history"));
    navButtons[2].addEventListener("click", () => showScreen("settings"));
}

if (resetDataButton) {
    resetDataButton.addEventListener("click", () => {
        const confirmed = confirm("Res želiš izbrisati vso zgodovino, dolg in podatke o tankanjih?");
        if (!confirmed) return;
        localStorage.clear();
        location.reload();
    });
}

updateHome();
updateSettings();
if (screens.home && screens.history && screens.settings) showScreen("home");