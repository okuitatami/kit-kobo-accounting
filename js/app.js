// Supabase Configuration
// 環境変数から取得（本番環境）、なければデフォルト値（開発環境）
const SUPABASE_URL = typeof window !== 'undefined' && window.SUPABASE_URL 
    ? window.SUPABASE_URL 
    : 'https://ciavfcyecpiejhfarfxl.supabase.co';
    
const SUPABASE_ANON_KEY = typeof window !== 'undefined' && window.SUPABASE_ANON_KEY 
    ? window.SUPABASE_ANON_KEY 
    : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpYXZmY3llY3BpZWpoZmFyZnhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NjkzMzUsImV4cCI6MjA4MTQ0NTMzNX0.kPHcu8iWicBj0StrK72xvzL2XgAuXQtd9LUzIPsldIw';

// Initialize Supabase client
let supabase;
if (typeof window.supabase !== 'undefined') {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Company Information
const COMPANY_INFO = {
    name: 'KIT工房',
    representative: '奥井啓太',
    address: '兵庫県神戸市灘区永手町5丁目3-18-303',
    phone: '070-8403-3158',
    bank: {
        name: 'あおぞら銀行',
        branch: 'BANKブルー支店　普通預金',
        accountNumber: '0295638',
        accountName: 'オクイケイタ'
    }
};

// Account Chart (勘定科目マスタ)
const ACCOUNTS = {
    assets: [
        '現金', '普通預金', '売掛金', '前払金', '仮払金', '事業主借'
    ],
    liabilities: [
        '買掛金', '未払金', '前受金', '預り金', '事業主貸'
    ],
    revenue: [
        '売上高'
    ],
    expenses: [
        '仕入高', '外注費', '消耗品費', '通信費', '旅費交通費',
        '水道光熱費', '広告宣伝費', '接待交際費', '地代家賃',
        '減価償却費', '租税公課', '雑費'
    ]
};

// Global State
let currentYear = new Date().getFullYear();
let csvData = null;
let csvParsedData = [];

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
    // Check Supabase connection
    if (!supabase || SUPABASE_URL === 'YOUR_SUPABASE_URL_HERE') {
        showNotification('⚠️ Supabaseの設定が必要です。環境変数を設定してください。', 'warning');
    }

    initializeTabs();
    initializeAccountSelects();
    initializeYearSelects();
    initializeDateFields();
    initializeEventListeners();
    
    // Initialize item containers
    initializeItemContainers();
    
    await loadAllData();
    updateDashboard();
});

// Tab Navigation
function initializeTabs() {
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update active content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(targetTab).classList.add('active');
            
            // Load data for specific tabs
            if (targetTab === 'dashboard') {
                updateDashboard();
            } else if (targetTab === 'journal') {
                displayJournalEntries();
            } else if (targetTab === 'quotations') {
                displayQuotations();
            } else if (targetTab === 'invoices') {
                displayInvoices();
            } else if (targetTab === 'customers') {
                displayCustomers();
            } else if (targetTab === 'services') {
                displayServices();
            } else if (targetTab === 'recurring') {
                displayRecurringRevenue();
            }
        });
    });
}

// Initialize Account Selects
function initializeAccountSelects() {
    const debitSelect = document.getElementById('debit-account');
    const creditSelect = document.getElementById('credit-account');
    
    const allAccounts = [
        ...ACCOUNTS.assets,
        ...ACCOUNTS.liabilities,
        ...ACCOUNTS.revenue,
        ...ACCOUNTS.expenses
    ];
    
    allAccounts.forEach(account => {
        const option1 = document.createElement('option');
        option1.value = account;
        option1.textContent = account;
        debitSelect.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = account;
        option2.textContent = account;
        creditSelect.appendChild(option2);
    });
}

// Initialize Year Selects
function initializeYearSelects() {
    const yearSelect = document.getElementById('report-year');
    const currentYear = new Date().getFullYear();
    
    for (let year = currentYear - 5; year <= currentYear + 1; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = `${year}年`;
        if (year === currentYear) option.selected = true;
        yearSelect.appendChild(option);
    }
    
    // CSV year
    document.getElementById('csv-year').value = currentYear;
    
    // Journal month filter
    const monthFilter = document.getElementById('journal-month-filter');
    for (let month = 1; month <= 12; month++) {
        const option = document.createElement('option');
        option.value = month;
        option.textContent = `${month}月`;
        monthFilter.appendChild(option);
    }
}

// Initialize Date Fields
function initializeDateFields() {
    const today = new Date().toISOString().split('T')[0];
    
    // Journal entry date
    document.getElementById('entry-date').value = today;
    
    // Quote date
    const quoteDate = document.getElementById('quote-date');
    quoteDate.value = today;
    quoteDate.addEventListener('change', updateQuoteExpiry);
    
    // Invoice date
    const invoiceDate = document.getElementById('invoice-date');
    invoiceDate.value = today;
    invoiceDate.addEventListener('change', updateInvoiceDue);
    
    updateQuoteExpiry();
    updateInvoiceDue();
}

// Update Quote Expiry (90 days)
function updateQuoteExpiry() {
    const quoteDate = document.getElementById('quote-date').value;
    if (quoteDate) {
        const date = new Date(quoteDate);
        date.setDate(date.getDate() + 90);
        document.getElementById('quote-expiry').value = date.toISOString().split('T')[0];
    }
}

// Update Invoice Due Date (45 days)
function updateInvoiceDue() {
    const invoiceDate = document.getElementById('invoice-date').value;
    if (invoiceDate) {
        const date = new Date(invoiceDate);
        date.setDate(date.getDate() + 45);
        document.getElementById('invoice-due').value = date.toISOString().split('T')[0];
    }
}

// Initialize Event Listeners
function initializeEventListeners() {
    // Journal Form
    document.getElementById('journal-form').addEventListener('submit', handleJournalSubmit);
    
    // Customer Form
    document.getElementById('customer-form').addEventListener('submit', handleCustomerSubmit);
    
    // Service Form
    document.getElementById('service-form').addEventListener('submit', handleServiceSubmit);
    
    // Quotation Form
    document.getElementById('quotation-form').addEventListener('submit', handleQuotationSubmit);
    
    // Invoice Form
    document.getElementById('invoice-form').addEventListener('submit', handleInvoiceSubmit);
    
    // Journal Month Filter
    document.getElementById('journal-month-filter').addEventListener('change', displayJournalEntries);
    
    // CSV Upload
    const uploadArea = document.getElementById('csv-upload-area');
    const fileInput = document.getElementById('csv-file-input');
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file) handleCSVFile(file);
    });
    
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleCSVFile(file);
    });
}

// ===============================
// ITEM MANAGEMENT
// ===============================

function initializeItemContainers() {
    // Add first item to quote and invoice forms
    addQuoteItem();
    addInvoiceItem();
}

function addQuoteItem() {
    const container = document.getElementById('quote-items');
    const itemCount = container.children.length;
    
    const itemDiv = document.createElement('div');
    itemDiv.className = 'item-row';
    itemDiv.innerHTML = `
        <div class="item-row-content">
            <input type="text" class="item-description" placeholder="品目" required>
            <input type="number" class="item-quantity" placeholder="数量" value="1" min="1" required>
            <input type="number" class="item-price" placeholder="単価" min="0" required>
            <select class="item-tax-rate" required>
                <option value="0.10">10%</option>
                <option value="0.08">8%</option>
                <option value="0.00">0%</option>
            </select>
            <input type="text" class="item-amount" placeholder="¥0" readonly>
            ${itemCount > 0 ? '<button type="button" class="btn-remove" onclick="removeItem(this)">削除</button>' : ''}
        </div>
    `;
    
    container.appendChild(itemDiv);
    
    // Add event listeners for calculations
    const inputs = itemDiv.querySelectorAll('.item-quantity, .item-price, .item-tax-rate');
    inputs.forEach(input => {
        input.addEventListener('input', () => calculateQuoteTotals());
    });
}

function addInvoiceItem() {
    const container = document.getElementById('invoice-items');
    const itemCount = container.children.length;
    
    const itemDiv = document.createElement('div');
    itemDiv.className = 'item-row';
    itemDiv.innerHTML = `
        <div class="item-row-content">
            <input type="text" class="item-description" placeholder="品目" required>
            <input type="number" class="item-quantity" placeholder="数量" value="1" min="1" required>
            <input type="number" class="item-price" placeholder="単価" min="0" required>
            <select class="item-tax-rate" required>
                <option value="0.10">10%</option>
                <option value="0.08">8%</option>
                <option value="0.00">0%</option>
            </select>
            <input type="text" class="item-amount" placeholder="¥0" readonly>
            ${itemCount > 0 ? '<button type="button" class="btn-remove" onclick="removeItem(this)">削除</button>' : ''}
        </div>
    `;
    
    container.appendChild(itemDiv);
    
    // Add event listeners for calculations
    const inputs = itemDiv.querySelectorAll('.item-quantity, .item-price, .item-tax-rate');
    inputs.forEach(input => {
        input.addEventListener('input', () => calculateInvoiceTotals());
    });
}

function removeItem(button) {
    const itemRow = button.closest('.item-row');
    const container = itemRow.parentElement;
    
    // Don't remove if it's the last item
    if (container.children.length <= 1) {
        showNotification('最低1つの明細が必要です', 'warning');
        return;
    }
    
    itemRow.remove();
    
    // Recalculate totals
    if (container.id === 'quote-items') {
        calculateQuoteTotals();
    } else {
        calculateInvoiceTotals();
    }
}

function calculateQuoteTotals() {
    const container = document.getElementById('quote-items');
    const items = container.querySelectorAll('.item-row');
    
    let subtotal = 0;
    let totalTax = 0;
    
    items.forEach(item => {
        const quantity = parseFloat(item.querySelector('.item-quantity').value) || 0;
        const price = parseFloat(item.querySelector('.item-price').value) || 0;
        const taxRate = parseFloat(item.querySelector('.item-tax-rate').value) || 0;
        
        const amount = quantity * price;
        const tax = amount * taxRate;
        
        item.querySelector('.item-amount').value = `¥${amount.toLocaleString()}`;
        
        subtotal += amount;
        totalTax += tax;
    });
    
    const total = subtotal + totalTax;
    
    document.getElementById('quote-subtotal').value = `¥${subtotal.toLocaleString()}`;
    document.getElementById('quote-tax').value = `¥${totalTax.toLocaleString()}`;
    document.getElementById('quote-total').value = `¥${total.toLocaleString()}`;
}

function calculateInvoiceTotals() {
    const container = document.getElementById('invoice-items');
    const items = container.querySelectorAll('.item-row');
    
    let subtotal = 0;
    let totalTax = 0;
    
    items.forEach(item => {
        const quantity = parseFloat(item.querySelector('.item-quantity').value) || 0;
        const price = parseFloat(item.querySelector('.item-price').value) || 0;
        const taxRate = parseFloat(item.querySelector('.item-tax-rate').value) || 0;
        
        const amount = quantity * price;
        const tax = amount * taxRate;
        
        item.querySelector('.item-amount').value = `¥${amount.toLocaleString()}`;
        
        subtotal += amount;
        totalTax += tax;
    });
    
    const total = subtotal + totalTax;
    
    document.getElementById('invoice-subtotal').value = `¥${subtotal.toLocaleString()}`;
    document.getElementById('invoice-tax').value = `¥${totalTax.toLocaleString()}`;
    document.getElementById('invoice-total').value = `¥${total.toLocaleString()}`;
}

function collectQuoteItems() {
    const container = document.getElementById('quote-items');
    const items = container.querySelectorAll('.item-row');
    
    return Array.from(items).map(item => ({
        description: item.querySelector('.item-description').value,
        quantity: parseFloat(item.querySelector('.item-quantity').value),
        price: parseFloat(item.querySelector('.item-price').value),
        taxRate: parseFloat(item.querySelector('.item-tax-rate').value)
    }));
}

function collectInvoiceItems() {
    const container = document.getElementById('invoice-items');
    const items = container.querySelectorAll('.item-row');
    
    return Array.from(items).map(item => ({
        description: item.querySelector('.item-description').value,
        quantity: parseFloat(item.querySelector('.item-quantity').value),
        price: parseFloat(item.querySelector('.item-price').value),
        taxRate: parseFloat(item.querySelector('.item-tax-rate').value)
    }));
}

// ===============================
// SUPABASE DATA OPERATIONS
// ===============================

// Load All Data
async function loadAllData() {
    try {
        await Promise.all([
            loadCustomers(),
            loadServices(),
            loadJournalEntries(),
            loadQuotations(),
            loadInvoices(),
            loadRecurringRevenue()
        ]);
    } catch (error) {
        console.error('Error loading data:', error);
        showNotification('データの読み込みに失敗しました', 'error');
    }
}

// Customers
async function loadCustomers() {
    if (!supabase) return [];
    
    try {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Update customer selects
        updateCustomerSelects(data || []);
        
        return data || [];
    } catch (error) {
        console.error('Error loading customers:', error);
        return [];
    }
}

function updateCustomerSelects(customers) {
    const quoteCustomer = document.getElementById('quote-customer');
    const invoiceCustomer = document.getElementById('invoice-customer');
    const recurringCustomer = document.getElementById('recurring-customer');
    
    // Clear existing options except first
    quoteCustomer.innerHTML = '<option value="">顧客を選択...</option>';
    invoiceCustomer.innerHTML = '<option value="">顧客を選択...</option>';
    if (recurringCustomer) {
        recurringCustomer.innerHTML = '<option value="">顧客を選択...</option>';
    }
    
    customers.forEach(customer => {
        const option1 = document.createElement('option');
        option1.value = customer.id;
        option1.textContent = customer.name + (customer.company ? ` (${customer.company})` : '');
        quoteCustomer.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = customer.id;
        option2.textContent = customer.name + (customer.company ? ` (${customer.company})` : '');
        invoiceCustomer.appendChild(option2);
        
        if (recurringCustomer) {
            const option3 = document.createElement('option');
            option3.value = customer.id;
            option3.textContent = customer.name + (customer.company ? ` (${customer.company})` : '');
            recurringCustomer.appendChild(option3);
        }
    });
}

async function handleCustomerSubmit(e) {
    e.preventDefault();
    
    if (!supabase) {
        showNotification('Supabaseが設定されていません', 'error');
        return;
    }
    
    const customerData = {
        name: document.getElementById('customer-name').value,
        company: document.getElementById('customer-company').value,
        address: document.getElementById('customer-address').value,
        phone: document.getElementById('customer-phone').value,
        email: document.getElementById('customer-email').value
    };
    
    try {
        const { error } = await supabase
            .from('customers')
            .insert([customerData]);
        
        if (error) throw error;
        
        showNotification('顧客を登録しました', 'success');
        e.target.reset();
        await loadCustomers();
        displayCustomers();
    } catch (error) {
        console.error('Error adding customer:', error);
        showNotification('顧客の登録に失敗しました', 'error');
    }
}

async function displayCustomers() {
    const customers = await loadCustomers();
    const list = document.getElementById('customer-list');
    
    if (customers.length === 0) {
        list.innerHTML = '<p class="info-text">顧客が登録されていません</p>';
        return;
    }
    
    list.innerHTML = customers.map(customer => `
        <div class="data-item">
            <div class="data-item-info">
                <strong>${customer.name}</strong>
                ${customer.company ? `<br><span>${customer.company}</span>` : ''}
                ${customer.phone ? `<br><span>📞 ${customer.phone}</span>` : ''}
                ${customer.email ? `<br><span>📧 ${customer.email}</span>` : ''}
            </div>
            <div class="data-item-actions">
                <button class="btn btn-danger" onclick="deleteCustomer('${customer.id}')">削除</button>
            </div>
        </div>
    `).join('');
}

async function deleteCustomer(id) {
    if (!confirm('この顧客を削除しますか？')) return;
    
    if (!supabase) {
        showNotification('Supabaseが設定されていません', 'error');
        return;
    }
    
    try {
        const { error } = await supabase
            .from('customers')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        showNotification('顧客を削除しました', 'success');
        await loadCustomers();
        displayCustomers();
    } catch (error) {
        console.error('Error deleting customer:', error);
        showNotification('顧客の削除に失敗しました', 'error');
    }
}

// Services
async function loadServices() {
    if (!supabase) return [];
    
    try {
        const { data, error } = await supabase
            .from('services')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        return data || [];
    } catch (error) {
        console.error('Error loading services:', error);
        return [];
    }
}

async function handleServiceSubmit(e) {
    e.preventDefault();
    
    if (!supabase) {
        showNotification('Supabaseが設定されていません', 'error');
        return;
    }
    
    const serviceData = {
        name: document.getElementById('service-name').value,
        category: document.getElementById('service-category').value,
        unit_price: parseFloat(document.getElementById('service-price').value),
        unit: document.getElementById('service-unit').value,
        tax_rate: parseFloat(document.getElementById('service-tax').value)
    };
    
    try {
        const { error } = await supabase
            .from('services')
            .insert([serviceData]);
        
        if (error) throw error;
        
        showNotification('サービスを登録しました', 'success');
        e.target.reset();
        displayServices();
    } catch (error) {
        console.error('Error adding service:', error);
        showNotification('サービスの登録に失敗しました', 'error');
    }
}

async function displayServices() {
    const services = await loadServices();
    const list = document.getElementById('service-list');
    
    if (services.length === 0) {
        list.innerHTML = '<p class="info-text">サービスが登録されていません</p>';
        return;
    }
    
    list.innerHTML = services.map(service => `
        <div class="data-item">
            <div class="data-item-info">
                <strong>${service.name}</strong>
                <br><span>カテゴリ: ${service.category}</span>
                <br><span>単価: ¥${service.unit_price.toLocaleString()} / ${service.unit}</span>
                <br><span>消費税率: ${(service.tax_rate * 100).toFixed(0)}%</span>
            </div>
            <div class="data-item-actions">
                <button class="btn btn-danger" onclick="deleteService('${service.id}')">削除</button>
            </div>
        </div>
    `).join('');
}

async function deleteService(id) {
    if (!confirm('このサービスを削除しますか？')) return;
    
    if (!supabase) {
        showNotification('Supabaseが設定されていません', 'error');
        return;
    }
    
    try {
        const { error } = await supabase
            .from('services')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        showNotification('サービスを削除しました', 'success');
        displayServices();
    } catch (error) {
        console.error('Error deleting service:', error);
        showNotification('サービスの削除に失敗しました', 'error');
    }
}

// Journal Entries
async function loadJournalEntries() {
    if (!supabase) return [];
    
    try {
        const { data, error } = await supabase
            .from('journal_entries')
            .select('*')
            .order('date', { ascending: false });
        
        if (error) throw error;
        
        return data || [];
    } catch (error) {
        console.error('Error loading journal entries:', error);
        return [];
    }
}

async function handleJournalSubmit(e) {
    e.preventDefault();
    
    if (!supabase) {
        showNotification('Supabaseが設定されていません', 'error');
        return;
    }
    
    const debitAmount = parseFloat(document.getElementById('debit-amount').value);
    const creditAmount = parseFloat(document.getElementById('credit-amount').value);
    
    // Validate amounts match
    if (debitAmount !== creditAmount) {
        showNotification('借方と貸方の金額が一致しません', 'error');
        return;
    }
    
    const entryData = {
        date: document.getElementById('entry-date').value,
        debit_account: document.getElementById('debit-account').value,
        debit_amount: debitAmount,
        credit_account: document.getElementById('credit-account').value,
        credit_amount: creditAmount,
        description: document.getElementById('description').value
    };
    
    try {
        const { error } = await supabase
            .from('journal_entries')
            .insert([entryData]);
        
        if (error) throw error;
        
        showNotification('仕訳を追加しました', 'success');
        e.target.reset();
        initializeDateFields();
        displayJournalEntries();
        updateDashboard();
    } catch (error) {
        console.error('Error adding journal entry:', error);
        showNotification('仕訳の追加に失敗しました', 'error');
    }
}

async function displayJournalEntries() {
    const entries = await loadJournalEntries();
    const list = document.getElementById('journal-list');
    const monthFilter = document.getElementById('journal-month-filter').value;
    
    let filteredEntries = entries;
    if (monthFilter) {
        filteredEntries = entries.filter(entry => {
            const month = new Date(entry.date).getMonth() + 1;
            return month === parseInt(monthFilter);
        });
    }
    
    if (filteredEntries.length === 0) {
        list.innerHTML = '<p class="info-text">仕訳がありません</p>';
        return;
    }
    
    const html = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>日付</th>
                    <th>借方科目</th>
                    <th>借方金額</th>
                    <th>貸方科目</th>
                    <th>貸方金額</th>
                    <th>摘要</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
                ${filteredEntries.map(entry => `
                    <tr>
                        <td>${entry.date}</td>
                        <td>${entry.debit_account}</td>
                        <td>¥${entry.debit_amount.toLocaleString()}</td>
                        <td>${entry.credit_account}</td>
                        <td>¥${entry.credit_amount.toLocaleString()}</td>
                        <td>${entry.description}</td>
                        <td>
                            <button class="btn btn-danger" onclick="deleteJournalEntry('${entry.id}')">削除</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    list.innerHTML = html;
}

async function deleteJournalEntry(id) {
    if (!confirm('この仕訳を削除しますか？')) return;
    
    if (!supabase) {
        showNotification('Supabaseが設定されていません', 'error');
        return;
    }
    
    try {
        const { error } = await supabase
            .from('journal_entries')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        showNotification('仕訳を削除しました', 'success');
        displayJournalEntries();
        updateDashboard();
    } catch (error) {
        console.error('Error deleting journal entry:', error);
        showNotification('仕訳の削除に失敗しました', 'error');
    }
}

// Quotations
async function loadQuotations() {
    if (!supabase) return [];
    
    try {
        const { data, error } = await supabase
            .from('quotations')
            .select('*, customers(*)')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        return data || [];
    } catch (error) {
        console.error('Error loading quotations:', error);
        return [];
    }
}

async function handleQuotationSubmit(e) {
    e.preventDefault();
    
    if (!supabase) {
        showNotification('Supabaseが設定されていません', 'error');
        return;
    }
    
    const customerId = document.getElementById('quote-customer').value;
    if (!customerId) {
        showNotification('顧客を選択してください', 'error');
        return;
    }
    
    // Collect items
    const items = collectQuoteItems();
    
    // Calculate totals
    let subtotal = 0;
    let totalTax = 0;
    
    items.forEach(item => {
        const amount = item.quantity * item.price;
        const tax = amount * item.taxRate;
        subtotal += amount;
        totalTax += tax;
    });
    
    const total = subtotal + totalTax;
    
    // Generate quote number
    const quotations = await loadQuotations();
    const year = new Date().getFullYear();
    const count = quotations.filter(q => q.quote_number.startsWith(`Q-${year}-`)).length + 1;
    const quoteNumber = `Q-${year}-${String(count).padStart(3, '0')}`;
    
    const quotationData = {
        quote_number: quoteNumber,
        customer_id: customerId,
        issue_date: document.getElementById('quote-date').value,
        expiry_date: document.getElementById('quote-expiry').value,
        items: items,
        subtotal: subtotal,
        tax: totalTax,
        total: total
    };
    
    try {
        const { error } = await supabase
            .from('quotations')
            .insert([quotationData]);
        
        if (error) throw error;
        
        showNotification('見積書を作成しました', 'success');
        e.target.reset();
        initializeDateFields();
        
        // Clear items and re-initialize
        document.getElementById('quote-items').innerHTML = '';
        addQuoteItem();
        calculateQuoteTotals();
        
        displayQuotations();
    } catch (error) {
        console.error('Error creating quotation:', error);
        showNotification('見積書の作成に失敗しました', 'error');
    }
}

async function displayQuotations() {
    const quotations = await loadQuotations();
    const list = document.getElementById('quotation-list');
    
    if (quotations.length === 0) {
        list.innerHTML = '<p class="info-text">見積書がありません</p>';
        return;
    }
    
    list.innerHTML = quotations.map(quote => `
        <div class="data-item">
            <div class="data-item-info">
                <strong>${quote.quote_number}</strong>
                <br><span>顧客: ${quote.customers?.name || '不明'}</span>
                <br><span>発行日: ${quote.issue_date}</span>
                <br><span>有効期限: ${quote.expiry_date}</span>
                <br><span>合計: ¥${(quote.total || 0).toLocaleString()}</span>
            </div>
            <div class="data-item-actions">
                <button class="btn btn-secondary" onclick="viewQuotePDF('${quote.id}')">📄 印刷/PDF</button>
                <button class="btn btn-success" onclick="convertToInvoice('${quote.id}')">請求書へ変換</button>
                <button class="btn btn-danger" onclick="deleteQuotation('${quote.id}')">削除</button>
            </div>
        </div>
    `).join('');
}

async function deleteQuotation(id) {
    if (!confirm('この見積書を削除しますか？')) return;
    
    if (!supabase) {
        showNotification('Supabaseが設定されていません', 'error');
        return;
    }
    
    try {
        const { error } = await supabase
            .from('quotations')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        showNotification('見積書を削除しました', 'success');
        displayQuotations();
    } catch (error) {
        console.error('Error deleting quotation:', error);
        showNotification('見積書の削除に失敗しました', 'error');
    }
}

// Convert Quote to Invoice
async function convertToInvoice(quoteId) {
    if (!supabase) {
        showNotification('Supabaseが設定されていません', 'error');
        return;
    }
    
    try {
        // Get quotation data
        const { data: quote, error: quoteError } = await supabase
            .from('quotations')
            .select('*')
            .eq('id', quoteId)
            .single();
        
        if (quoteError) throw quoteError;
        
        // Generate invoice number
        const invoices = await loadInvoices();
        const year = new Date().getFullYear();
        const count = invoices.filter(i => i.invoice_number.startsWith(`I-${year}-`)).length + 1;
        const invoiceNumber = `I-${year}-${String(count).padStart(3, '0')}`;
        
        // Create invoice with same data
        const today = new Date().toISOString().split('T')[0];
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 45);
        
        const invoiceData = {
            invoice_number: invoiceNumber,
            customer_id: quote.customer_id,
            issue_date: today,
            due_date: dueDate.toISOString().split('T')[0],
            items: quote.items,
            subtotal: quote.subtotal,
            tax: quote.tax,
            total: quote.total,
            status: 'unpaid'
        };
        
        const { error: invoiceError } = await supabase
            .from('invoices')
            .insert([invoiceData]);
        
        if (invoiceError) throw invoiceError;
        
        // Create journal entry for invoice
        await createInvoiceJournalEntry(invoiceData);
        
        showNotification(`請求書 ${invoiceNumber} を作成しました`, 'success');
        displayInvoices();
        
        // Switch to invoice tab
        document.querySelector('[data-tab="invoices"]').click();
        
    } catch (error) {
        console.error('Error converting to invoice:', error);
        showNotification('請求書への変換に失敗しました', 'error');
    }
}

// Invoices
async function loadInvoices() {
    if (!supabase) return [];
    
    try {
        const { data, error } = await supabase
            .from('invoices')
            .select('*, customers(*)')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        return data || [];
    } catch (error) {
        console.error('Error loading invoices:', error);
        return [];
    }
}

async function handleInvoiceSubmit(e) {
    e.preventDefault();
    
    if (!supabase) {
        showNotification('Supabaseが設定されていません', 'error');
        return;
    }
    
    const customerId = document.getElementById('invoice-customer').value;
    if (!customerId) {
        showNotification('顧客を選択してください', 'error');
        return;
    }
    
    // Collect items
    const items = collectInvoiceItems();
    
    // Calculate totals
    let subtotal = 0;
    let totalTax = 0;
    
    items.forEach(item => {
        const amount = item.quantity * item.price;
        const tax = amount * item.taxRate;
        subtotal += amount;
        totalTax += tax;
    });
    
    const total = subtotal + totalTax;
    
    // Generate invoice number
    const invoices = await loadInvoices();
    const year = new Date().getFullYear();
    const count = invoices.filter(i => i.invoice_number.startsWith(`I-${year}-`)).length + 1;
    const invoiceNumber = `I-${year}-${String(count).padStart(3, '0')}`;
    
    const invoiceData = {
        invoice_number: invoiceNumber,
        customer_id: customerId,
        issue_date: document.getElementById('invoice-date').value,
        due_date: document.getElementById('invoice-due').value,
        items: items,
        subtotal: subtotal,
        tax: totalTax,
        total: total,
        status: 'unpaid'
    };
    
    try {
        const { error } = await supabase
            .from('invoices')
            .insert([invoiceData]);
        
        if (error) throw error;
        
        showNotification('請求書を作成しました', 'success');
        e.target.reset();
        initializeDateFields();
        
        // Clear items and re-initialize
        document.getElementById('invoice-items').innerHTML = '';
        addInvoiceItem();
        calculateInvoiceTotals();
        
        displayInvoices();
        
        // Create journal entry for invoice
        await createInvoiceJournalEntry(invoiceData);
    } catch (error) {
        console.error('Error creating invoice:', error);
        showNotification('請求書の作成に失敗しました', 'error');
    }
}

async function createInvoiceJournalEntry(invoice) {
    if (invoice.total <= 0) return;
    
    const entryData = {
        date: invoice.issue_date,
        debit_account: '売掛金',
        debit_amount: invoice.total,
        credit_account: '売上高',
        credit_amount: invoice.total,
        description: `請求書 ${invoice.invoice_number}`
    };
    
    try {
        const { error } = await supabase
            .from('journal_entries')
            .insert([entryData]);
        
        if (error) throw error;
    } catch (error) {
        console.error('Error creating journal entry:', error);
    }
}

async function displayInvoices() {
    const invoices = await loadInvoices();
    const list = document.getElementById('invoice-list');
    
    if (invoices.length === 0) {
        list.innerHTML = '<p class="info-text">請求書がありません</p>';
        return;
    }
    
    list.innerHTML = invoices.map(invoice => `
        <div class="data-item">
            <div class="data-item-info">
                <strong>${invoice.invoice_number}</strong>
                ${invoice.status === 'paid' ? '<span class="badge-success">支払済</span>' : '<span class="badge-danger">未払</span>'}
                <br><span>顧客: ${invoice.customers?.name || '不明'}</span>
                <br><span>発行日: ${invoice.issue_date}</span>
                <br><span>支払期限: ${invoice.due_date}</span>
                <br><span>合計: ¥${(invoice.total || 0).toLocaleString()}</span>
            </div>
            <div class="data-item-actions">
                <button class="btn btn-secondary" onclick="viewInvoicePDF('${invoice.id}')">📄 印刷/PDF</button>
                ${invoice.status === 'unpaid' ? `<button class="btn btn-success" onclick="markAsPaid('${invoice.id}')">支払済にする</button>` : ''}
                <button class="btn btn-danger" onclick="deleteInvoice('${invoice.id}')">削除</button>
            </div>
        </div>
    `).join('');
}

async function markAsPaid(id) {
    if (!supabase) {
        showNotification('Supabaseが設定されていません', 'error');
        return;
    }
    
    try {
        // Update invoice status
        const { data: invoice, error: updateError } = await supabase
            .from('invoices')
            .update({ status: 'paid' })
            .eq('id', id)
            .select()
            .single();
        
        if (updateError) throw updateError;
        
        // Create journal entry for payment
        const entryData = {
            date: new Date().toISOString().split('T')[0],
            debit_account: '普通預金',
            debit_amount: invoice.total,
            credit_account: '売掛金',
            credit_amount: invoice.total,
            description: `入金 ${invoice.invoice_number}`
        };
        
        const { error: journalError } = await supabase
            .from('journal_entries')
            .insert([entryData]);
        
        if (journalError) throw journalError;
        
        showNotification('支払済に更新しました', 'success');
        displayInvoices();
        updateDashboard();
    } catch (error) {
        console.error('Error marking as paid:', error);
        showNotification('更新に失敗しました', 'error');
    }
}

async function deleteInvoice(id) {
    if (!confirm('この請求書を削除しますか？')) return;
    
    if (!supabase) {
        showNotification('Supabaseが設定されていません', 'error');
        return;
    }
    
    try {
        const { error } = await supabase
            .from('invoices')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        showNotification('請求書を削除しました', 'success');
        displayInvoices();
        updateDashboard();
    } catch (error) {
        console.error('Error deleting invoice:', error);
        showNotification('請求書の削除に失敗しました', 'error');
    }
}

// ===============================
// RECURRING REVENUE MANAGEMENT
// ===============================

async function loadRecurringRevenue() {
    if (!supabase) return [];
    
    try {
        const { data, error } = await supabase
            .from('recurring_revenue')
            .select('*, customers(*)')
            .order('created_at', { ascending: false });
        
        if (error) {
            // Table might not exist yet
            console.warn('recurring_revenue table not found:', error);
            return [];
        }
        
        return data || [];
    } catch (error) {
        console.error('Error loading recurring revenue:', error);
        return [];
    }
}

async function handleRecurringSubmit(e) {
    e.preventDefault();
    
    if (!supabase) {
        showNotification('Supabaseが設定されていません', 'error');
        return;
    }
    
    const recurringData = {
        customer_id: document.getElementById('recurring-customer').value,
        service_name: document.getElementById('recurring-service').value,
        amount: parseFloat(document.getElementById('recurring-amount').value),
        tax_rate: parseFloat(document.getElementById('recurring-tax').value),
        start_date: document.getElementById('recurring-start').value,
        billing_day: document.getElementById('recurring-billing-day').value,
        notes: document.getElementById('recurring-notes').value,
        status: 'active'
    };
    
    try {
        const { error } = await supabase
            .from('recurring_revenue')
            .insert([recurringData]);
        
        if (error) throw error;
        
        showNotification('継続収入を登録しました', 'success');
        e.target.reset();
        displayRecurringRevenue();
        updateDashboard();
    } catch (error) {
        console.error('Error adding recurring revenue:', error);
        if (error.message.includes('relation "recurring_revenue" does not exist')) {
            showNotification('recurring_revenueテーブルが存在しません。Supabaseでテーブルを作成してください。', 'error');
        } else {
            showNotification('継続収入の登録に失敗しました', 'error');
        }
    }
}

async function displayRecurringRevenue() {
    const recurring = await loadRecurringRevenue();
    const list = document.getElementById('recurring-list');
    
    if (!list) return;
    
    if (recurring.length === 0) {
        list.innerHTML = '<p class="info-text">継続収入が登録されていません</p>';
        return;
    }
    
    list.innerHTML = recurring.map(item => {
        const statusBadge = item.status === 'active' ? 'badge-success' : 
                           item.status === 'paused' ? 'badge-warning' : 'badge-danger';
        const statusText = item.status === 'active' ? '契約中' : 
                          item.status === 'paused' ? '一時停止' : '解約済';
        
        return `
            <div class="data-item">
                <div class="data-item-info">
                    <strong>${item.service_name}</strong>
                    <span class="${statusBadge}">${statusText}</span>
                    <br><span>顧客: ${item.customers?.name || '不明'}</span>
                    <br><span>月額: ¥${item.amount.toLocaleString()}</span>
                    <br><span>開始日: ${item.start_date}</span>
                    <br><span>請求日: 毎月${item.billing_day}日</span>
                    ${item.notes ? `<br><span>備考: ${item.notes}</span>` : ''}
                </div>
                <div class="data-item-actions">
                    ${item.status === 'active' ? `
                        <button class="btn btn-secondary" onclick="pauseRecurring('${item.id}')">一時停止</button>
                    ` : ''}
                    ${item.status === 'paused' ? `
                        <button class="btn btn-success" onclick="resumeRecurring('${item.id}')">再開</button>
                    ` : ''}
                    ${item.status !== 'cancelled' ? `
                        <button class="btn btn-danger" onclick="cancelRecurring('${item.id}')">解約</button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

async function pauseRecurring(id) {
    if (!confirm('この契約を一時停止しますか？')) return;
    
    try {
        const { error } = await supabase
            .from('recurring_revenue')
            .update({ status: 'paused' })
            .eq('id', id);
        
        if (error) throw error;
        
        showNotification('契約を一時停止しました', 'success');
        displayRecurringRevenue();
        updateDashboard();
    } catch (error) {
        console.error('Error pausing recurring:', error);
        showNotification('一時停止に失敗しました', 'error');
    }
}

async function resumeRecurring(id) {
    try {
        const { error } = await supabase
            .from('recurring_revenue')
            .update({ status: 'active' })
            .eq('id', id);
        
        if (error) throw error;
        
        showNotification('契約を再開しました', 'success');
        displayRecurringRevenue();
        updateDashboard();
    } catch (error) {
        console.error('Error resuming recurring:', error);
        showNotification('再開に失敗しました', 'error');
    }
}

async function cancelRecurring(id) {
    if (!confirm('この契約を解約しますか？')) return;
    
    try {
        const { error } = await supabase
            .from('recurring_revenue')
            .update({ status: 'cancelled' })
            .eq('id', id);
        
        if (error) throw error;
        
        showNotification('契約を解約しました', 'success');
        displayRecurringRevenue();
        updateDashboard();
    } catch (error) {
        console.error('Error cancelling recurring:', error);
        showNotification('解約に失敗しました', 'error');
    }
}

async function generateMonthlyJournals() {
    if (!confirm('今月分の継続収入の仕訳を生成しますか？')) return;
    
    try {
        const recurring = await loadRecurringRevenue();
        const activeRecurring = recurring.filter(r => r.status === 'active');
        
        if (activeRecurring.length === 0) {
            showNotification('契約中の継続収入がありません', 'warning');
            return;
        }
        
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        
        const entries = activeRecurring.map(item => {
            const totalAmount = item.amount * (1 + item.tax_rate);
            
            return {
                date: dateStr,
                debit_account: '売掛金',
                debit_amount: totalAmount,
                credit_account: '売上高',
                credit_amount: totalAmount,
                description: `継続収入: ${item.service_name} (${item.customers?.name || '不明'})`
            };
        });
        
        const { error } = await supabase
            .from('journal_entries')
            .insert(entries);
        
        if (error) throw error;
        
        showNotification(`${entries.length}件の仕訳を生成しました`, 'success');
        displayJournalEntries();
        updateDashboard();
        
        // Switch to journal tab
        document.querySelector('[data-tab="journal"]').click();
        
    } catch (error) {
        console.error('Error generating monthly journals:', error);
        showNotification('仕訳の生成に失敗しました', 'error');
    }
}

// Dashboard
async function updateDashboard() {
    const entries = await loadJournalEntries();
    const invoices = await loadInvoices();
    const recurring = await loadRecurringRevenue();
    
    // Calculate totals
    let totalRevenue = 0;
    let totalExpense = 0;
    
    entries.forEach(entry => {
        if (entry.credit_account === '売上高') {
            totalRevenue += entry.credit_amount;
        }
        if (ACCOUNTS.expenses.includes(entry.debit_account)) {
            totalExpense += entry.debit_amount;
        }
    });
    
    const totalProfit = totalRevenue - totalExpense;
    const unpaidAmount = invoices
        .filter(inv => inv.status === 'unpaid')
        .reduce((sum, inv) => sum + (inv.total || 0), 0);
    
    // Calculate monthly recurring revenue
    const activeRecurring = recurring.filter(r => r.status === 'active');
    const monthlyRecurring = activeRecurring.reduce((sum, r) => sum + (r.amount * (1 + r.tax_rate)), 0);
    
    // Update summary cards
    document.getElementById('total-revenue').textContent = `¥${totalRevenue.toLocaleString()}`;
    document.getElementById('total-expense').textContent = `¥${totalExpense.toLocaleString()}`;
    document.getElementById('total-profit').textContent = `¥${totalProfit.toLocaleString()}`;
    document.getElementById('unpaid-invoices').textContent = `¥${unpaidAmount.toLocaleString()}`;
    
    // Update recurring revenue cards if they exist
    const recurringRevenueEl = document.getElementById('monthly-recurring');
    const recurringCustomersEl = document.getElementById('recurring-customers');
    
    if (recurringRevenueEl) {
        recurringRevenueEl.textContent = `¥${monthlyRecurring.toLocaleString()}`;
    }
    
    if (recurringCustomersEl) {
        recurringCustomersEl.textContent = `${activeRecurring.length}件`;
    }
    
    // Update charts
    updateCharts(entries);
    
    // Update recent entries
    displayRecentEntries(entries.slice(0, 5));
}

function updateCharts(entries) {
    // Monthly chart data
    const monthlyData = {};
    entries.forEach(entry => {
        const month = new Date(entry.date).getMonth();
        if (!monthlyData[month]) {
            monthlyData[month] = { revenue: 0, expense: 0 };
        }
        if (entry.credit_account === '売上高') {
            monthlyData[month].revenue += entry.credit_amount;
        }
        if (ACCOUNTS.expenses.includes(entry.debit_account)) {
            monthlyData[month].expense += entry.debit_amount;
        }
    });
    
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    const revenueData = months.map((_, i) => monthlyData[i]?.revenue || 0);
    const expenseData = months.map((_, i) => monthlyData[i]?.expense || 0);
    
    // Monthly Chart
    const monthlyCtx = document.getElementById('monthlyChart');
    if (monthlyCtx && typeof Chart !== 'undefined') {
        // Clear existing chart
        const existingChart = Chart.getChart(monthlyCtx);
        if (existingChart) {
            existingChart.destroy();
        }
        
        new Chart(monthlyCtx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: '売上',
                    data: revenueData,
                    borderColor: '#11998e',
                    backgroundColor: 'rgba(17, 153, 142, 0.1)',
                    tension: 0.4
                }, {
                    label: '経費',
                    data: expenseData,
                    borderColor: '#eb3349',
                    backgroundColor: 'rgba(235, 51, 73, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });
    }
    
    // Expense Chart
    const expenseByCategory = {};
    entries.forEach(entry => {
        if (ACCOUNTS.expenses.includes(entry.debit_account)) {
            expenseByCategory[entry.debit_account] = (expenseByCategory[entry.debit_account] || 0) + entry.debit_amount;
        }
    });
    
    const expenseCtx = document.getElementById('expenseChart');
    if (expenseCtx && typeof Chart !== 'undefined' && Object.keys(expenseByCategory).length > 0) {
        // Clear existing chart
        const existingChart = Chart.getChart(expenseCtx);
        if (existingChart) {
            existingChart.destroy();
        }
        
        new Chart(expenseCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(expenseByCategory),
                datasets: [{
                    data: Object.values(expenseByCategory),
                    backgroundColor: [
                        '#667eea', '#764ba2', '#f093fb', '#f5576c',
                        '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
                        '#fa709a', '#fee140', '#30cfd0', '#330867'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    }
}

function displayRecentEntries(entries) {
    const list = document.getElementById('recent-entries-list');
    
    if (entries.length === 0) {
        list.innerHTML = '<p class="info-text">仕訳がありません</p>';
        return;
    }
    
    list.innerHTML = entries.map(entry => `
        <div class="data-item">
            <div class="data-item-info">
                <strong>${entry.date}</strong>
                <br><span>${entry.debit_account} ¥${entry.debit_amount.toLocaleString()} / ${entry.credit_account} ¥${entry.credit_amount.toLocaleString()}</span>
                <br><span>${entry.description}</span>
            </div>
        </div>
    `).join('');
}

// ===============================
// PDF GENERATION
// ===============================

async function viewQuotePDF(id) {
    if (!supabase) {
        showNotification('Supabaseが設定されていません', 'error');
        return;
    }
    
    try {
        // Get quotation data
        const { data: quote, error } = await supabase
            .from('quotations')
            .select('*, customers(*)')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        generatePrintableDocument(quote, 'quote');
    } catch (error) {
        console.error('Error generating document:', error);
        showNotification('帳票生成に失敗しました', 'error');
    }
}

async function viewInvoicePDF(id) {
    if (!supabase) {
        showNotification('Supabaseが設定されていません', 'error');
        return;
    }
    
    try {
        // Get invoice data
        const { data: invoice, error } = await supabase
            .from('invoices')
            .select('*, customers(*)')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        generatePrintableDocument(invoice, 'invoice');
    } catch (error) {
        console.error('Error generating document:', error);
        showNotification('帳票生成に失敗しました', 'error');
    }
}

function generatePrintableDocument(data, type) {
    const title = type === 'quote' ? '見積書' : '請求書';
    const number = type === 'quote' ? data.quote_number : data.invoice_number;
    const issueDate = type === 'quote' ? data.issue_date : data.issue_date;
    const expiryOrDue = type === 'quote' ? data.expiry_date : data.due_date;
    const expiryOrDueLabel = type === 'quote' ? '有効期限' : '支払期限';
    
    // Create printable HTML
    const printWindow = window.open('', '_blank');
    
    let itemsHTML = '';
    if (data.items && Array.isArray(data.items)) {
        data.items.forEach(item => {
            const amount = (item.quantity || 0) * (item.price || 0);
            itemsHTML += `
                <tr>
                    <td>${item.description || ''}</td>
                    <td style="text-align: center;">${item.quantity || 0}</td>
                    <td style="text-align: right;">¥${(item.price || 0).toLocaleString()}</td>
                    <td style="text-align: right;">¥${amount.toLocaleString()}</td>
                </tr>
            `;
        });
    }
    
    let bankInfoHTML = '';
    if (type === 'invoice') {
        bankInfoHTML = `
            <div style="margin-top: 40px; padding: 20px; background: #f8f9fa; border-left: 4px solid #667eea;">
                <h3 style="margin-bottom: 15px; color: #667eea;">お振込先</h3>
                <p style="margin: 5px 0;"><strong>銀行名:</strong> ${COMPANY_INFO.bank.name}</p>
                <p style="margin: 5px 0;"><strong>支店名:</strong> ${COMPANY_INFO.bank.branch}</p>
                <p style="margin: 5px 0;"><strong>口座番号:</strong> ${COMPANY_INFO.bank.accountNumber}</p>
                <p style="margin: 5px 0;"><strong>名義:</strong> ${COMPANY_INFO.bank.accountName}</p>
                <p style="margin-top: 15px; font-size: 0.9em; color: #666;">※振込手数料は振込人の負担とさせていただきます</p>
            </div>
        `;
    }
    
    const html = `
        <!DOCTYPE html>
        <html lang="ja">
        <head>
            <meta charset="UTF-8">
            <title>${title} - ${number}</title>
            <style>
                @media print {
                    body { margin: 0; }
                    .no-print { display: none; }
                    @page { margin: 20mm; }
                }
                body {
                    font-family: 'MS Gothic', 'Hiragino Kaku Gothic Pro', sans-serif;
                    max-width: 900px;
                    margin: 0 auto;
                    padding: 40px 20px;
                    background: white;
                }
                .header {
                    text-align: center;
                    margin-bottom: 40px;
                }
                .header h1 {
                    font-size: 32px;
                    margin: 0 0 20px 0;
                    color: #333;
                }
                .document-info {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 40px;
                }
                .document-info div {
                    flex: 1;
                }
                .company-info {
                    text-align: right;
                }
                .company-info p {
                    margin: 5px 0;
                }
                .customer-info {
                    margin-bottom: 30px;
                }
                .customer-info h3 {
                    font-size: 18px;
                    margin-bottom: 10px;
                    border-bottom: 2px solid #667eea;
                    padding-bottom: 5px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 30px 0;
                }
                table th, table td {
                    border: 1px solid #ddd;
                    padding: 12px;
                    text-align: left;
                }
                table th {
                    background: #667eea;
                    color: white;
                    font-weight: bold;
                }
                .totals {
                    width: 100%;
                    max-width: 400px;
                    margin-left: auto;
                    margin-top: 30px;
                }
                .totals table {
                    margin: 0;
                }
                .totals table td {
                    border: 1px solid #ddd;
                    padding: 10px;
                }
                .totals .total-row {
                    background: #f8f9fa;
                    font-weight: bold;
                    font-size: 1.2em;
                }
                .print-button {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 15px 30px;
                    background: #667eea;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 16px;
                    box-shadow: 0 3px 10px rgba(0,0,0,0.2);
                }
                .print-button:hover {
                    background: #5568d3;
                }
            </style>
        </head>
        <body>
            <button class="print-button no-print" onclick="window.print()">🖨️ 印刷 / PDF保存</button>
            
            <div class="header">
                <h1>${title}</h1>
            </div>
            
            <div class="document-info">
                <div>
                    <p><strong>${type === 'quote' ? '見積番号' : '請求番号'}:</strong> ${number}</p>
                    <p><strong>発行日:</strong> ${issueDate}</p>
                    <p><strong>${expiryOrDueLabel}:</strong> ${expiryOrDue}</p>
                </div>
                <div class="company-info">
                    <p><strong>${COMPANY_INFO.name}</strong></p>
                    <p>${COMPANY_INFO.representative}</p>
                    <p>${COMPANY_INFO.address}</p>
                    <p>TEL: ${COMPANY_INFO.phone}</p>
                </div>
            </div>
            
            <div class="customer-info">
                <h3>お客様</h3>
                <p><strong>${data.customers?.name || ''}</strong></p>
                ${data.customers?.company ? `<p>${data.customers.company}</p>` : ''}
                ${data.customers?.address ? `<p>${data.customers.address}</p>` : ''}
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>品目</th>
                        <th style="width: 80px; text-align: center;">数量</th>
                        <th style="width: 120px; text-align: right;">単価</th>
                        <th style="width: 120px; text-align: right;">金額</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHTML}
                </tbody>
            </table>
            
            <div class="totals">
                <table>
                    <tr>
                        <td>小計</td>
                        <td style="text-align: right;">¥${(data.subtotal || 0).toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td>消費税</td>
                        <td style="text-align: right;">¥${(data.tax || 0).toLocaleString()}</td>
                    </tr>
                    <tr class="total-row">
                        <td>合計</td>
                        <td style="text-align: right;">¥${(data.total || 0).toLocaleString()}</td>
                    </tr>
                </table>
            </div>
            
            ${bankInfoHTML}
            
        </body>
        </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
    
    showNotification('印刷プレビューを開きました。印刷またはPDF保存できます。', 'success');
}

// Reports
async function generateReport() {
    const year = parseInt(document.getElementById('report-year').value);
    const entries = await loadJournalEntries();
    
    // Filter by year
    const yearEntries = entries.filter(entry => {
        return new Date(entry.date).getFullYear() === year;
    });
    
    // Calculate totals
    const accountTotals = {};
    
    yearEntries.forEach(entry => {
        // Debit
        if (!accountTotals[entry.debit_account]) {
            accountTotals[entry.debit_account] = { debit: 0, credit: 0 };
        }
        accountTotals[entry.debit_account].debit += entry.debit_amount;
        
        // Credit
        if (!accountTotals[entry.credit_account]) {
            accountTotals[entry.credit_account] = { debit: 0, credit: 0 };
        }
        accountTotals[entry.credit_account].credit += entry.credit_amount;
    });
    
    // Revenue and Expenses
    let revenue = accountTotals['売上高']?.credit || 0;
    let expenses = 0;
    
    ACCOUNTS.expenses.forEach(account => {
        expenses += accountTotals[account]?.debit || 0;
    });
    
    const netIncome = revenue - expenses;
    const blueDeduction = 650000;
    const finalIncome = Math.max(0, netIncome - blueDeduction);
    
    // Display report
    document.getElementById('report-result').style.display = 'block';
    
    // Income statement
    let incomeHTML = `
        <tr>
            <td><strong>売上高</strong></td>
            <td><strong>¥${revenue.toLocaleString()}</strong></td>
        </tr>
    `;
    
    ACCOUNTS.expenses.forEach(account => {
        const amount = accountTotals[account]?.debit || 0;
        if (amount > 0) {
            incomeHTML += `
                <tr>
                    <td>${account}</td>
                    <td>¥${amount.toLocaleString()}</td>
                </tr>
            `;
        }
    });
    
    incomeHTML += `
        <tr>
            <td><strong>経費合計</strong></td>
            <td><strong>¥${expenses.toLocaleString()}</strong></td>
        </tr>
        <tr>
            <td><strong>差引金額</strong></td>
            <td><strong>¥${netIncome.toLocaleString()}</strong></td>
        </tr>
    `;
    
    document.getElementById('report-income').innerHTML = incomeHTML;
    
    // Tax data
    document.getElementById('tax-revenue').textContent = `¥${revenue.toLocaleString()}`;
    document.getElementById('tax-expense').textContent = `¥${expenses.toLocaleString()}`;
    document.getElementById('tax-net-income').textContent = `¥${netIncome.toLocaleString()}`;
    document.getElementById('tax-final-income').textContent = `¥${finalIncome.toLocaleString()}`;
    
    // Account summary
    let summaryHTML = '<table class="data-table"><thead><tr><th>科目</th><th>借方合計</th><th>貸方合計</th><th>残高</th></tr></thead><tbody>';
    
    Object.keys(accountTotals).sort().forEach(account => {
        const totals = accountTotals[account];
        const balance = totals.debit - totals.credit;
        summaryHTML += `
            <tr>
                <td>${account}</td>
                <td>¥${totals.debit.toLocaleString()}</td>
                <td>¥${totals.credit.toLocaleString()}</td>
                <td>¥${Math.abs(balance).toLocaleString()} ${balance >= 0 ? '(借)' : '(貸)'}</td>
            </tr>
        `;
    });
    
    summaryHTML += '</tbody></table>';
    document.getElementById('account-summary').innerHTML = summaryHTML;
}

function printReport() {
    window.print();
}

function exportReportCSV() {
    // TODO: Implement CSV export
    showNotification('CSV出力機能は開発中です', 'info');
}

// CSV Import Functions
function handleCSVFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        csvData = new Uint8Array(e.target.result);
        document.getElementById('parse-csv-btn').disabled = false;
        showNotification(`ファイル "${file.name}" を読み込みました`, 'success');
    };
    reader.readAsArrayBuffer(file);
}

function parseCSV() {
    if (!csvData) {
        showNotification('CSVファイルを選択してください', 'error');
        return;
    }
    
    const year = parseInt(document.getElementById('csv-year').value);
    if (!year || year < 2000 || year > 2100) {
        showNotification('正しい年度を入力してください', 'error');
        return;
    }
    
    try {
        // Detect encoding and convert to UTF-8
        const detectedEncoding = Encoding.detect(csvData);
        const unicodeArray = Encoding.convert(csvData, {
            to: 'UNICODE',
            from: detectedEncoding || 'SJIS'
        });
        const csvText = Encoding.codeToString(unicodeArray);
        
        // Parse CSV
        const lines = csvText.trim().split('\n');
        const headers = parseCSVLine(lines[0]);
        
        // Validate headers
        const expectedHeaders = ['番号', '明細区分', '取扱日付', '起算日', 'お支払金額', 'お預り金額', '取引区分', '残高', '摘要'];
        const headersMatch = headers.every((h, i) => h === expectedHeaders[i]);
        
        if (!headersMatch) {
            showNotification('CSVフォーマットが正しくありません', 'error');
            return;
        }
        
        // Parse data
        csvParsedData = [];
        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            if (values.length < 9) continue;
            
            const dateStr = values[2]; // 取扱日付
            const paymentStr = values[4]; // お支払金額
            const depositStr = values[5]; // お預り金額
            const typeStr = values[6]; // 取引区分
            const description = values[8]; // 摘要
            
            // Parse date (format: "10月20日")
            const dateMatch = dateStr.match(/(\d+)月(\d+)日/);
            if (!dateMatch) continue;
            
            const month = parseInt(dateMatch[1]);
            const day = parseInt(dateMatch[2]);
            const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            // Parse amounts
            const paymentAmount = parseAmount(paymentStr);
            const depositAmount = parseAmount(depositStr);
            
            // Determine transaction type and suggest account
            let debitAccount, creditAccount, amount;
            
            if (depositAmount > 0) {
                // Deposit (入金)
                amount = depositAmount;
                debitAccount = '普通預金';
                creditAccount = suggestAccount(description, 'credit');
            } else if (paymentAmount > 0) {
                // Payment (出金)
                amount = paymentAmount;
                debitAccount = suggestAccount(description, 'debit');
                creditAccount = '普通預金';
            } else {
                continue;
            }
            
            csvParsedData.push({
                date,
                debitAccount,
                creditAccount,
                amount,
                description,
                type: typeStr,
                selected: true
            });
        }
        
        displayCSVPreview();
        showNotification(`${csvParsedData.length}件の取引を解析しました`, 'success');
        
    } catch (error) {
        console.error('CSV parse error:', error);
        showNotification('CSVの解析に失敗しました', 'error');
    }
}

function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    values.push(current.trim());
    return values;
}

function parseAmount(str) {
    if (!str) return 0;
    const cleaned = str.replace(/[¥,円]/g, '').replace(/\\/g, '');
    const amount = parseFloat(cleaned);
    return isNaN(amount) ? 0 : amount;
}

function suggestAccount(description, type) {
    const keywords = {
        'ATM': '事業主貸',
        '引出': '事業主貸',
        '現金': '事業主貸',
        '振込': type === 'credit' ? '売掛金' : '事業主貸',
        '振替': type === 'credit' ? '売掛金' : '事業主貸',
        'NTT': '通信費',
        'ドコモ': '通信費',
        'ソフトバンク': '通信費',
        '通信': '通信費',
        'Amazon': '消耗品費',
        'アマゾン': '消耗品費',
        'ヨドバシ': '消耗品費',
        'アスクル': '消耗品費',
        '電力': '水道光熱費',
        'ガス': '水道光熱費',
        '水道': '水道光熱費',
        'JR': '旅費交通費',
        'タクシー': '旅費交通費',
        'ETC': '旅費交通費',
        'Google': '広告宣伝費',
        'Meta': '広告宣伝費',
        'Facebook': '広告宣伝費',
        '広告': '広告宣伝費',
        '家賃': '地代家賃',
        '賃料': '地代家賃'
    };
    
    for (const [keyword, account] of Object.entries(keywords)) {
        if (description.includes(keyword)) {
            return account;
        }
    }
    
    return type === 'credit' ? '売上高' : '事業主貸';
}

function displayCSVPreview() {
    const preview = document.getElementById('csv-preview');
    const table = document.getElementById('csv-preview-table');
    
    if (csvParsedData.length === 0) {
        preview.style.display = 'none';
        return;
    }
    
    preview.style.display = 'block';
    
    const allAccounts = [
        ...ACCOUNTS.assets,
        ...ACCOUNTS.liabilities,
        ...ACCOUNTS.revenue,
        ...ACCOUNTS.expenses
    ];
    
    let html = `
        <thead>
            <tr>
                <th><input type="checkbox" checked onchange="toggleAllCSVRows(this)"></th>
                <th>日付</th>
                <th>借方科目</th>
                <th>貸方科目</th>
                <th>金額</th>
                <th>区分</th>
                <th>摘要</th>
            </tr>
        </thead>
        <tbody>
    `;
    
    csvParsedData.forEach((row, index) => {
        const badge = row.type === '入金' ? 'badge-success' : 'badge-danger';
        
        html += `
            <tr>
                <td><input type="checkbox" ${row.selected ? 'checked' : ''} onchange="toggleCSVRow(${index}, this)"></td>
                <td>${row.date}</td>
                <td>
                    <select onchange="updateCSVRow(${index}, 'debitAccount', this.value)">
                        ${allAccounts.map(acc => `<option value="${acc}" ${acc === row.debitAccount ? 'selected' : ''}>${acc}</option>`).join('')}
                    </select>
                </td>
                <td>
                    <select onchange="updateCSVRow(${index}, 'creditAccount', this.value)">
                        ${allAccounts.map(acc => `<option value="${acc}" ${acc === row.creditAccount ? 'selected' : ''}>${acc}</option>`).join('')}
                    </select>
                </td>
                <td>¥${row.amount.toLocaleString()}</td>
                <td><span class="${badge}">${row.type}</span></td>
                <td>${row.description}</td>
            </tr>
        `;
    });
    
    html += '</tbody>';
    table.innerHTML = html;
}

function toggleAllCSVRows(checkbox) {
    csvParsedData.forEach(row => {
        row.selected = checkbox.checked;
    });
    displayCSVPreview();
}

function toggleCSVRow(index, checkbox) {
    csvParsedData[index].selected = checkbox.checked;
}

function updateCSVRow(index, field, value) {
    csvParsedData[index][field] = value;
}

async function importCSVData() {
    if (!supabase) {
        showNotification('Supabaseが設定されていません', 'error');
        return;
    }
    
    const selectedRows = csvParsedData.filter(row => row.selected);
    
    if (selectedRows.length === 0) {
        showNotification('取引が選択されていません', 'error');
        return;
    }
    
    try {
        const entries = selectedRows.map(row => ({
            date: row.date,
            debit_account: row.debitAccount,
            debit_amount: row.amount,
            credit_account: row.creditAccount,
            credit_amount: row.amount,
            description: row.description
        }));
        
        const { error } = await supabase
            .from('journal_entries')
            .insert(entries);
        
        if (error) throw error;
        
        showNotification(`${selectedRows.length}件の取引を一括登録しました`, 'success');
        
        // Reset CSV data
        csvData = null;
        csvParsedData = [];
        document.getElementById('csv-preview').style.display = 'none';
        document.getElementById('csv-file-input').value = '';
        document.getElementById('parse-csv-btn').disabled = true;
        
        // Switch to dashboard
        document.querySelector('[data-tab="dashboard"]').click();
        updateDashboard();
        
    } catch (error) {
        console.error('Error importing CSV:', error);
        showNotification('一括登録に失敗しました', 'error');
    }
}

// Notification System
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#17a2b8'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s;
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
