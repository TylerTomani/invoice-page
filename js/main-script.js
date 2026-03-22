// main-script.js
// DOM
// ===============================
const nameSelect = document.getElementById("nameSelect");
const toAddress = document.getElementById("toAddress");
const fromAddress = document.getElementById("fromAdress");
const saveCustomerBtn = document.getElementById("saveCustomerBtn");
const deleteCustomerBtn = document.getElementById("deleteCustomerBtn");
const newCustomerInput = document.getElementById("newCustomerInput");
const newCustomerBtn = document.getElementById("newCustomerBtn");
// IMPORTS
// ===============================
import { initDarkMode } from "./dark-mode.js";
import { initZoom } from "./zoom.js";

// STORAGE KEYS
// ===============================
const STORAGE_KEY = "customerData";
const DRAFT_KEY = "customerDrafts";
// APP STATE
// ===============================
let currentCustomerId = null;
let isNewCustomerMode = false; // 👈 add this
// INIT
// ===============================
addEventListener("DOMContentLoaded", initMain);
function initMain() {
    initDarkMode();
    initZoom();
    initCustomerData();
    populateSelect();
    loadAddressForSelectedId();
    setupEventListeners();
}
// STATE HELPERS
// ===============================
function getCustomerData() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"customers":[]}');
}
function getDrafts() {
    return JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}");
}
function saveCustomerData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data, null, 2));
}
function saveDrafts(drafts) {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts, null, 2));
}
// ===============================
// INITIAL DATA
// ===============================
function initCustomerData() {
    let data = getCustomerData();

    if (data.customers.length === 0) {
        data.customers = [
            { id: 1, name: "Brian Mintz", address: "5678 Nine Street Sioux Falls ND" },
            { id: 2, name: "Daniel & Jeanne Pavlina", address: "" },
            { id: 3, name: "Ed Ziegler", address: "" }
        ];

        saveCustomerData(data);
    }
}
// ===============================
// CORE LOGIC
// ===============================
function loadAddressForSelectedId() {
    const selectedId = parseInt(nameSelect.value, 10);
    // Save previous draft
    if (currentCustomerId) {
        const drafts = getDrafts();
        drafts[currentCustomerId] = toAddress.value;
        saveDrafts(drafts);
    }

    currentCustomerId = selectedId;

    if (!selectedId) {
        toAddress.value = "";
        return;
    }

    const data = getCustomerData();
    const drafts = getDrafts();
    const customer = data.customers.find(c => c.id === selectedId);

    toAddress.value = drafts[selectedId] ?? customer?.address ?? "";
}

// ===============================
// SAVE (UNIFIED)
// ===============================
function addOrUpdateAddress() {
    const isCreatingNew = isNewCustomerMode;
    // ============================
    // 🆕 NEW CUSTOMER
    if (isCreatingNew) {
        const name = newCustomerInput.value.trim();
        if (!name) return alert("Enter a customer name first.");
        const data = getCustomerData();
        const newId = data.customers.length
            ? Math.max(...data.customers.map(c => c.id)) + 1
            : 1;
        const newCustomer = {
            id: newId,
            name,
            address: toAddress.value.trim()
        };
        data.customers.push(newCustomer);
        saveCustomerData(data);
        // clear draft
        const drafts = getDrafts();
        delete drafts[newId];
        saveDrafts(drafts);
        // reset UI
        newCustomerInput.style.display = "none";
        nameSelect.style.display = "block";
        exitNewCustomerMode(); // 👈 THIS replaces your manual display toggles
        populateSelect();
        nameSelect.value = newId;
        currentCustomerId = newId;
        alert(`Customer "${name}" created and saved`);
        return;
    }

    // ============================
    // ✏️ EXISTING CUSTOMER
    // ============================
    const selectedId = parseInt(nameSelect.value, 10);
    if (!selectedId) return alert("Please select a customer first.");

    const data = getCustomerData();
    const customer = data.customers.find(c => c.id === selectedId);

    if (!customer) {
        alert("Customer not found.");
        return;
    }

    customer.address = toAddress.value.trim();
    saveCustomerData(data);

    const drafts = getDrafts();
    delete drafts[selectedId];
    saveDrafts(drafts);

    alert(`Address saved for ${customer.name}`);
}

// ===============================
// DELETE
// ===============================
// ===============================
// DELETE (FULL CUSTOMER)
// ===============================
function deleteCustomerAddress() {
    const selectedId = parseInt(nameSelect.value, 10);
    if (!selectedId) return alert("Please select a customer first.");

    const data = getCustomerData();
    const customerIndex = data.customers.findIndex(c => c.id === selectedId);

    if (customerIndex === -1) {
        alert("Customer not found.");
        return;
    }

    const customer = data.customers[customerIndex];

    const isConfirmed = confirm(
        `Are you sure you want to delete "${customer.name}"?\n\nThis will remove the customer and their address permanently.`
    );

    if (!isConfirmed) return;

    // ❌ Remove customer completely
    data.customers.splice(customerIndex, 1);
    saveCustomerData(data);
    newCustomerBtn.focus()
    // ❌ Remove draft
    const drafts = getDrafts();
    delete drafts[selectedId];
    saveDrafts(drafts);

    // 🔄 Reset UI
    currentCustomerId = null;
    toAddress.value = "";

    populateSelect();

    // Select first available customer if exists
    if (data.customers.length > 0) {
        nameSelect.value = data.customers[0].id;
        loadAddressForSelectedId();
    }

    alert(`"${customer.name}" has been deleted.`);
}

// ===============================
// NEW CUSTOMER MODE
// ===============================
function enterNewCustomerMode() {
    isNewCustomerMode = true;

    nameSelect.style.display = "none";
    newCustomerInput.style.display = "block";

    newCustomerBtn.textContent = "❌ Cancel";

    newCustomerInput.value = "";

    // 👇 delay focus (prevents mobile glitching)
    setTimeout(() => {
        // newCustomerInput.focus();
    }, 50);

    toAddress.value = "";
}

function exitNewCustomerMode() {
    isNewCustomerMode = false;

    newCustomerInput.style.display = "none";
    nameSelect.style.display = "block";

    newCustomerBtn.textContent = "➕ New Customer"; // 👈

    newCustomerInput.value = "";
}
// ===============================
// UI SETUP
// ===============================
function populateSelect() {
    const data = getCustomerData();

    nameSelect.innerHTML = "";

    data.customers.forEach(c => {
        const option = document.createElement("option");
        option.value = c.id;
        option.textContent = c.name;
        nameSelect.appendChild(option);
    });
}



// ===============================
// EVENTS
// ===============================
function setupEventListeners() {

    // Switch customer
    nameSelect.addEventListener("change", loadAddressForSelectedId);

    // Draft typing
    toAddress.addEventListener("input", () => {
        const selectedId = parseInt(nameSelect.value, 10);
        if (!selectedId) return;

        const drafts = getDrafts();
        drafts[selectedId] = toAddress.value;
        saveDrafts(drafts);
    });

    // Save
    saveCustomerBtn.addEventListener("click", addOrUpdateAddress);

    // Delete
    deleteCustomerBtn.addEventListener("click", deleteCustomerAddress);

    // New customer mode
    newCustomerBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (isNewCustomerMode) {
            exitNewCustomerMode();
            newCustomerBtn.focus(); // 👈 helps mobile recover
        } else {
            enterNewCustomerMode();
        }
    });

    // Input behavior
    newCustomerInput.addEventListener("keydown", (e) => {

        if (e.key === "Enter") {
            addOrUpdateAddress(); // unified save
        }

        if (e.key === "Escape") {
            exitNewCustomerMode();
        }
    });
    addEventListener('keydown', e => {
        let key = e.key.toLowerCase()

    });
}

