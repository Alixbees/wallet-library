/**
 * Wallet Recharge Widget with Balance Display and Razorpay Integration
 * Standalone JavaScript widget for wallet recharge functionality
 */

(function(window, document) {
    'use strict';

    // Currency symbols map
    const CURRENCY_SYMBOLS = {
        'INR': '₹',
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'JPY': '¥',
        'AUD': 'A$',
        'CAD': 'C$',
        'SGD': 'S$',
        'AED': 'د.إ',
        'SAR': '﷼'
    };

    // Default configuration
    const DEFAULT_CONFIG = {
        apiKey: null,
        currency: 'INR',
        amounts: [100, 500, 1000, 2000, 5000],
        minAmount: 10,
        maxAmount: 50000,
        balanceApiUrl: null,
        balance: null,
        theme: {
            primaryColor: '#8b5cf6',
            successColor: '#059669',
            errorColor: '#dc2626',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        },
        text: {
            title: '💰 Wallet Recharge',
            subtitle: 'Choose your preferred amount to add',
            balanceTitle: 'Available Balance',
            customAmountLabel: '💳 Custom Amount',
            rechargeButton: 'Pay Now',
            processingText: 'Processing payment...',
            successMessage: 'Payment completed successfully!',
            errorMessage: 'Payment failed. Please try again.',
            balanceLoadingText: 'Loading balance...',
            balanceErrorText: 'Failed to load balance'
        },
        callbacks: {
            onSuccess: null,
            onFailure: null,
            onClose: null,
            onBalanceLoaded: null,
            onBalanceError: null
        }
    };

    // CSS Styles
    const CSS_STYLES = `
        .wallet-widget-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s ease, visibility 0.3s ease;
        }

        .wallet-widget-overlay.active {
            opacity: 1;
            visibility: visible;
        }

        .wallet-widget {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            max-width: 400px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            transform: scale(0.95);
            transition: transform 0.3s ease;
        }

        .wallet-widget-overlay.active .wallet-widget {
            transform: scale(1);
        }

        .wallet-widget-header {
            padding: 24px 24px 16px;
            border-bottom: 1px solid #e5e7eb;
            position: relative;
        }

        .wallet-widget-close {
            position: absolute;
            top: 16px;
            right: 16px;
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #6b7280;
            padding: 4px;
            border-radius: 4px;
            transition: background-color 0.2s ease;
        }

        .wallet-widget-close:hover {
            background-color: #f3f4f6;
        }

        .wallet-widget-title {
            font-size: 24px;
            font-weight: 600;
            color: #111827;
            margin: 0 0 8px 0;
        }

        .wallet-widget-subtitle {
            font-size: 14px;
            color: #6b7280;
            margin: 0;
        }

        .wallet-widget-body {
            padding: 24px;
        }

        .wallet-balance-display {
            padding: 16px;
            margin-bottom: 24px;
            border-radius: 8px;
            background-color: #f8fafc;
            border: 1px solid #e5e7eb;
        }

        .balance-title {
            font-size: 14px;
            color: #6b7280;
            margin: 0 0 4px 0;
        }

        .balance-amount {
            font-size: 24px;
            font-weight: 600;
            color: #111827;
            margin: 0;
        }

        .amount-selection {
            margin-bottom: 24px;
        }

        .amount-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
            gap: 12px;
            margin-bottom: 16px;
        }

        .amount-option {
            padding: 12px 16px;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            background: white;
            cursor: pointer;
            text-align: center;
            font-weight: 500;
            transition: all 0.2s ease;
            color: #374151;
        }

        .amount-option:hover {
            border-color: var(--primary-color, #2563eb);
            background-color: #f8fafc;
        }

        .amount-option.selected {
            border-color: var(--primary-color, #2563eb);
            background-color: var(--primary-color, #2563eb);
            color: white;
        }

        .custom-amount-section {
            margin-top: 16px;
        }

        .custom-amount-label {
            display: block;
            font-size: 14px;
            font-weight: 500;
            color: #374151;
            margin-bottom: 8px;
        }

        .custom-amount-input {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.2s ease;
            box-sizing: border-box;
        }

        .custom-amount-input:focus {
            outline: none;
            border-color: var(--primary-color, #2563eb);
        }

        .error-message {
            color: var(--error-color, #dc2626);
            font-size: 14px;
            margin-top: 8px;
        }

        .recharge-button {
            width: 100%;
            padding: 16px;
            background-color: var(--primary-color, #2563eb);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s ease;
            margin-top: 24px;
        }

        .recharge-button:hover:not(:disabled) {
            background-color: var(--primary-color-dark, #1d4ed8);
        }

        .recharge-button:disabled {
            background-color: #9ca3af;
            cursor: not-allowed;
        }

        .loading-spinner {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid #ffffff;
            border-radius: 50%;
            border-top-color: transparent;
            animation: spin 1s ease-in-out infinite;
            margin-right: 8px;
        }

        .skeleton-loader {
            background-color: #e5e7eb;
            border-radius: 4px;
            animation: pulse 1.5s ease-in-out infinite;
        }

        .balance-status-message {
            font-size: 14px;
            margin: 4px 0 0 0;
        }

        .balance-status-message.error {
            color: var(--error-color, #dc2626);
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        .status-message {
            padding: 12px 16px;
            border-radius: 8px;
            margin: 16px 0;
            font-weight: 500;
        }

        .status-message.success {
            background-color: #dcfce7;
            color: var(--success-color, #16a34a);
            border: 1px solid #bbf7d0;
        }

        .status-message.error {
            background-color: #fef2f2;
            color: var(--error-color, #dc2626);
            border: 1px solid #fecaca;
        }

        @media (max-width: 480px) {
            .wallet-widget {
                width: 95%;
                margin: 20px;
            }
            
            .wallet-widget-header,
            .wallet-widget-body {
                padding: 16px;
            }
            
            .amount-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }
    `;

    // Main Widget Class
    class WalletRechargeWidget {
        constructor(config = {}) {
            this.config = { ...DEFAULT_CONFIG, ...config };
            this.selectedAmount = null;
            this.customAmount = '';
            this.isProcessing = false;
            this.isBalanceLoading = false;
            this.overlay = null;
            this.widget = null;
            this.customData = config.customData || {};
            this.balance = this.config.balance;
            this.balanceError = null;

            // Get currency symbol
            this.currencySymbol = CURRENCY_SYMBOLS[this.config.currency] || this.config.currency;

            this.init();
        }

        init() {
            this.injectStyles();
            this.createWidget();
            this.bindEvents();
        }

        injectStyles() {
            if (document.getElementById('wallet-widget-styles')) return;

            const style = document.createElement('style');
            style.id = 'wallet-widget-styles';
            
            // Apply theme colors as CSS variables
            let cssWithTheme = CSS_STYLES;
            cssWithTheme = cssWithTheme.replace(/var\(--primary-color, #2563eb\)/g, this.config.theme.primaryColor);
            cssWithTheme = cssWithTheme.replace(/var\(--primary-color-dark, #1d4ed8\)/g, this.darkenColor(this.config.theme.primaryColor));
            cssWithTheme = cssWithTheme.replace(/var\(--success-color, #16a34a\)/g, this.config.theme.successColor);
            cssWithTheme = cssWithTheme.replace(/var\(--error-color, #dc2626\)/g, this.config.theme.errorColor);
            
            style.textContent = cssWithTheme;
            document.head.appendChild(style);
        }

        createWidget() {
            // Create overlay
            this.overlay = document.createElement('div');
            this.overlay.className = 'wallet-widget-overlay';
            this.overlay.innerHTML = this.getWidgetHTML();
            
            document.body.appendChild(this.overlay);
            this.widget = this.overlay.querySelector('.wallet-widget');
        }

        getWidgetHTML() {
            const amountOptions = this.config.amounts.map(amount => 
                `<button class="amount-option" data-amount="${amount}">${this.currencySymbol}${amount}</button>`
            ).join('');

            // Determine balance display content
            let balanceContent;
            if (this.isBalanceLoading) {
                balanceContent = `
                    <p class="balance-title">${this.config.text.balanceTitle}</p>
                    <div class="balance-amount skeleton-loader" style="width: 120px; height: 28px;"></div>
                    <p class="balance-status-message">${this.config.text.balanceLoadingText}</p>
                `;
            } else if (this.balanceError) {
                balanceContent = `
                    <p class="balance-title">${this.config.text.balanceTitle}</p>
                    <p class="balance-amount">--</p>
                    <p class="balance-status-message error">${this.config.text.balanceErrorText}</p>
                `;
            } else if (this.balance !== null) {
                balanceContent = `
                    <p class="balance-title">${this.config.text.balanceTitle}</p>
                    <p class="balance-amount">${this.currencySymbol}${this.balance}</p>
                `;
            } else {
                balanceContent = `
                    <p class="balance-title">${this.config.text.balanceTitle}</p>
                    <div class="balance-amount skeleton-loader" style="width: 120px; height: 28px;"></div>
                `;
            }

            return `
                <div class="wallet-widget">
                    <div class="wallet-widget-header">
                        <button class="wallet-widget-close">&times;</button>
                        <h2 class="wallet-widget-title">${this.config.text.title}</h2>
                        <p class="wallet-widget-subtitle">${this.config.text.subtitle}</p>
                    </div>
                    <div class="wallet-widget-body">
                        <div class="wallet-balance-display">
                            ${balanceContent}
                        </div>
                        <div class="amount-selection">
                            <div class="amount-grid">
                                ${amountOptions}
                            </div>
                            <div class="custom-amount-section">
                                <label class="custom-amount-label">${this.config.text.customAmountLabel}</label>
                                <input 
                                    type="number" 
                                    class="custom-amount-input" 
                                    placeholder="Enter amount"
                                    min="${this.config.minAmount}"
                                    max="${this.config.maxAmount}"
                                >
                                <div class="error-message" style="display: none;"></div>
                            </div>
                        </div>
                        <button class="recharge-button">
                            ${this.config.text.rechargeButton}
                        </button>
                        <div class="status-message" style="display: none;"></div>
                    </div>
                </div>
            `;
        }

        resetAmountSelection() {
            this.selectedAmount = null;
            this.customAmount = '';
            this.clearAmountSelection();
            this.overlay.querySelector('.custom-amount-input').value = '';
            this.hideError();
        }

        bindEvents() {
            // Close button
            this.overlay.querySelector('.wallet-widget-close').addEventListener('click', () => {
                this.close();
                this.resetAmountSelection();
            });

            // Click outside to close
            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) {
                    this.close();
                    this.resetAmountSelection();
                }
            });

            // Amount selection
            this.overlay.querySelectorAll('.amount-option').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    this.selectAmount(parseInt(e.target.dataset.amount));
                });
            });

            // Custom amount input
            const customInput = this.overlay.querySelector('.custom-amount-input');
            customInput.addEventListener('input', (e) => {
                this.handleCustomAmountInput(e.target.value);
            });

            customInput.addEventListener('focus', () => {
                // Don't clear selection if input value matches selected amount
                const inputValue = parseFloat(customInput.value);
                if (!this.selectedAmount || inputValue !== this.selectedAmount) {
                    this.clearAmountSelection();
                }
            });

            // Recharge button
            this.overlay.querySelector('.recharge-button').addEventListener('click', () => {
                this.processRecharge();
            });

            // Escape key to close
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isVisible()) {
                    this.close();
                }
            });
        }

        selectAmount(amount) {
            this.selectedAmount = amount;
            this.customAmount = '';
            
            // Update UI
            this.overlay.querySelectorAll('.amount-option').forEach(btn => {
                btn.classList.remove('selected');
            });
            
            this.overlay.querySelector(`[data-amount="${amount}"]`).classList.add('selected');
            // Show selected amount in input field
            this.overlay.querySelector('.custom-amount-input').value = amount;
            this.hideError();
        }

        clearAmountSelection() {
            this.selectedAmount = null;
            this.overlay.querySelectorAll('.amount-option').forEach(btn => {
                btn.classList.remove('selected');
            });
        }

        handleCustomAmountInput(value) {
            this.customAmount = value;
            const numericValue = parseFloat(value);
            
            // Check if the custom amount matches any preset amount
            const matchingAmount = this.config.amounts.find(amount => amount === numericValue);
            
            if (matchingAmount) {
                // Select the matching preset amount
                this.selectedAmount = matchingAmount;
                this.customAmount = '';
                
                // Update UI to show selection
                this.overlay.querySelectorAll('.amount-option').forEach(btn => {
                    btn.classList.remove('selected');
                });
                this.overlay.querySelector(`[data-amount="${matchingAmount}"]`).classList.add('selected');
            } else {
                // Clear preset selection if value doesn't match any preset
                if (this.selectedAmount && numericValue !== this.selectedAmount) {
                    this.clearAmountSelection();
                }
            }
            
            this.hideError();
        }

        validateAmount() {
            const amount = this.getSelectedAmount();
            
            if (!amount || amount <= 0) {
                this.showError('Please select or enter a valid amount');
                return false;
            }
            
            if (amount < this.config.minAmount) {
                this.showError(`Minimum amount is ${this.currencySymbol}${this.config.minAmount}`);
                return false;
            }
            
            if (amount > this.config.maxAmount) {
                this.showError(`Maximum amount is ${this.currencySymbol}${this.config.maxAmount}`);
                return false;
            }
            
            return true;
        }

        getSelectedAmount() {
            if (this.customAmount) {
                return parseFloat(this.customAmount);
            }
            return this.selectedAmount;
        }

        async fetchBalance() {
            if (!this.config.balanceApiUrl && this.balance === null) {
                this.balanceError = 'No balance API URL provided';
                this.updateBalanceDisplay();
                return;
            }

            if (this.config.balanceApiUrl) {
                try {
                    this.isBalanceLoading = true;
                    this.balanceError = null;
                    this.updateBalanceDisplay();
                    
                    const response = await fetch(this.config.balanceApiUrl);
                    if (!response.ok) {
                        throw new Error('Failed to fetch balance');
                    }
                    
                    const data = await response.json();
                    this.balance = data.balance || data.amount || data.availableBalance;
                    this.balanceError = null;
                    
                    if (this.config.callbacks.onBalanceLoaded) {
                        this.config.callbacks.onBalanceLoaded(this.balance);
                    }
                } catch (error) {
                    this.balanceError = error.message;
                    if (this.config.callbacks.onBalanceError) {
                        this.config.callbacks.onBalanceError(error);
                    }
                } finally {
                    this.isBalanceLoading = false;
                    this.updateBalanceDisplay();
                }
            }
        }

        updateBalanceDisplay() {
            if (!this.overlay) return;
            
            const balanceContainer = this.overlay.querySelector('.wallet-balance-display');
            if (!balanceContainer) return;
            
            if (this.isBalanceLoading) {
                balanceContainer.innerHTML = `
                    <p class="balance-title">${this.config.text.balanceTitle}</p>
                    <div class="balance-amount skeleton-loader" style="width: 120px; height: 28px;"></div>
                    <p class="balance-status-message">${this.config.text.balanceLoadingText}</p>
                `;
            } else if (this.balanceError) {
                balanceContainer.innerHTML = `
                    <p class="balance-title">${this.config.text.balanceTitle}</p>
                    <p class="balance-amount">--</p>
                    <p class="balance-status-message error">${this.config.text.balanceErrorText}</p>
                `;
            } else if (this.balance !== null) {
                balanceContainer.innerHTML = `
                    <p class="balance-title">${this.config.text.balanceTitle}</p>
                    <p class="balance-amount">${this.currencySymbol}${this.balance}</p>
                `;
            } else {
                balanceContainer.innerHTML = `
                    <p class="balance-title">${this.config.text.balanceTitle}</p>
                    <div class="balance-amount skeleton-loader" style="width: 120px; height: 28px;"></div>
                `;
            }
        }

        processRecharge() {
            if (this.isProcessing) return;
            
            if (!this.validateAmount()) return;
            
            if (!this.config.apiKey) {
                this.showError('Razorpay API key not configured');
                return;
            }

            const amount = this.getSelectedAmount();
            this.setProcessing(true);
            
            // Add the selected amount to custom data
            const checkoutData = {
                ...this.customData,
                widgetAmount: amount,
                widgetCurrency: this.config.currency,
                timestamp: new Date().toISOString()
            };
            
            this.initializeRazorpay(amount, checkoutData);
        }

        initializeRazorpay(amount, customData) {
            // Load Razorpay script if not already loaded
            if (!window.Razorpay) {
                const script = document.createElement('script');
                script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                script.onload = () => this.openRazorpayCheckout(amount, customData);
                script.onerror = () => {
                    this.setProcessing(false);
                    this.showError('Failed to load payment gateway');
                };
                document.head.appendChild(script);
            } else {
                this.openRazorpayCheckout(amount, customData);
            }
        }

        openRazorpayCheckout(amount, customData) {
            const options = {
                key: this.config.apiKey,
                amount: amount * 100, // Convert to smallest currency unit
                currency: this.config.currency,
                name: 'Wallet Recharge',
                description: `Add ${this.currencySymbol}${amount} to wallet`,
                handler: (response) => {
                    this.handlePaymentSuccess(response, customData);
                },
                modal: {
                    ondismiss: () => {
                        this.setProcessing(false);
                        if (this.config.callbacks.onClose) {
                            this.config.callbacks.onClose();
                        }
                    }
                },
                theme: {
                    color: this.config.theme.primaryColor
                },
                notes: customData,
                prefill: {
                    ...(customData.email && { email: customData.email }),
                    ...(customData.contact && { contact: customData.contact }),
                    ...(customData.name && { name: customData.name })
                }
            };

            try {
                const rzp = new Razorpay(options);
                rzp.on('payment.failed', (response) => {
                    this.handlePaymentFailure(response, customData);
                });
                rzp.open();
            } catch (error) {
                this.setProcessing(false);
                this.showError('Failed to initialize payment');
            }
        }

        handlePaymentSuccess(response, customData) {
            this.setProcessing(false);
            this.showStatus(this.config.text.successMessage, 'success');
            
            // Refresh balance after successful payment
            this.fetchBalance();
            
            if (this.config.callbacks.onSuccess) {
                this.config.callbacks.onSuccess({
                    paymentId: response.razorpay_payment_id,
                    orderId: response.razorpay_order_id,
                    signature: response.razorpay_signature,
                    amount: this.getSelectedAmount(),
                    currency: this.config.currency,
                    customData: customData
                });
            }

            // Auto close after 2 seconds
            setTimeout(() => {
                this.close();
            }, 2000);
        }

        handlePaymentFailure(response, customData) {
            this.setProcessing(false);
            this.showStatus(this.config.text.errorMessage, 'error');
            
            if (this.config.callbacks.onFailure) {
                this.config.callbacks.onFailure({
                    error: response.error,
                    code: response.error.code,
                    description: response.error.description,
                    amount: this.getSelectedAmount(),
                    customData: customData
                });
            }
        }

        setProcessing(processing) {
            this.isProcessing = processing;
            const button = this.overlay.querySelector('.recharge-button');
            
            if (processing) {
                button.disabled = true;
                button.innerHTML = `<span class="loading-spinner"></span>${this.config.text.processingText}`;
            } else {
                button.disabled = false;
                button.innerHTML = this.config.text.rechargeButton;
            }
        }

        showError(message) {
            const errorEl = this.overlay.querySelector('.error-message');
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        }

        hideError() {
            const errorEl = this.overlay.querySelector('.error-message');
            errorEl.style.display = 'none';
        }

        showStatus(message, type) {
            const statusEl = this.overlay.querySelector('.status-message');
            statusEl.textContent = message;
            statusEl.className = `status-message ${type}`;
            statusEl.style.display = 'block';
        }

        darkenColor(hex) {
            // Simple color darkening function
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            if (result) {
                const r = Math.max(0, parseInt(result[1], 16) - 30);
                const g = Math.max(0, parseInt(result[2], 16) - 30);
                const b = Math.max(0, parseInt(result[3], 16) - 30);
                return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
            }
            return hex;
        }

        show() {
            this.overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Fetch balance when shown if we have an API URL
            if (this.config.balanceApiUrl && this.balance === null && !this.isBalanceLoading) {
                this.fetchBalance();
            }
        }

        close() {
            this.overlay.classList.remove('active');
            document.body.style.overflow = '';
            
            if (this.config.callbacks.onClose) {
                this.config.callbacks.onClose();
            }
        }

        isVisible() {
            return this.overlay.classList.contains('active');
        }

        destroy() {
            if (this.overlay) {
                document.body.removeChild(this.overlay);
                this.overlay = null;
            }
            
            const styles = document.getElementById('wallet-widget-styles');
            if (styles) {
                document.head.removeChild(styles);
            }
            
            document.body.style.overflow = '';
        }

        // Public method to update balance manually
        setBalance(balance) {
            this.balance = balance;
            this.balanceError = null;
            this.isBalanceLoading = false;
            this.updateBalanceDisplay();
        }
    }

    // Global API
    window.WalletRechargeWidget = WalletRechargeWidget;

    // Simple initialization function for easy usage
    window.initWalletWidget = function(config) {
        return new WalletRechargeWidget(config);
    };

})(window, document);
