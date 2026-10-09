/**
 * HR Employee Attrition Predictor - Frontend Interaction Script
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('predictionForm');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnSpinner = submitBtn.querySelector('.btn-spinner');
    const resetBtn = document.getElementById('resetBtn');

    // Preset Buttons
    const loadHighRiskBtn = document.getElementById('loadHighRiskBtn');
    const loadLowRiskBtn = document.getElementById('loadLowRiskBtn');

    // Result Card Elements
    const placeholderState = document.getElementById('placeholderState');
    const outputContent = document.getElementById('outputContent');
    const statusBadge = document.getElementById('statusBadge');
    const verdictBanner = document.getElementById('verdictBanner');
    const verdictIcon = document.getElementById('verdictIcon');
    const verdictTitle = document.getElementById('verdictTitle');
    const verdictDesc = document.getElementById('verdictDesc');
    const leaveProbText = document.getElementById('leaveProbText');
    const leaveProbBar = document.getElementById('leaveProbBar');
    const stayProbText = document.getElementById('stayProbText');
    const stayProbBar = document.getElementById('stayProbBar');
    const modelClassCode = document.getElementById('modelClassCode');
    const riskCategoryText = document.getElementById('riskCategoryText');

    // Preset Data Profiles
    const highRiskProfile = {
        Age: 25,
        DistanceFromHome: 28,
        MaritalStatus: 'Single',
        JobRole: 'Sales Representative',
        JobLevel: '1',
        BusinessTravel: 'Travel_Frequently',
        OverTime: 'Yes',
        MonthlyIncome: 2200,
        StockOptionLevel: '0',
        TotalWorkingYears: 2,
        YearsAtCompany: 1,
        YearsWithCurrManager: 0,
        JobSatisfaction: '1',
        EnvironmentSatisfaction: '1',
        JobInvolvement: '1'
    };

    const lowRiskProfile = {
        Age: 46,
        DistanceFromHome: 3,
        MaritalStatus: 'Married',
        JobRole: 'Manager',
        JobLevel: '4',
        BusinessTravel: 'Non-Travel',
        OverTime: 'No',
        MonthlyIncome: 14500,
        StockOptionLevel: '2',
        TotalWorkingYears: 22,
        YearsAtCompany: 12,
        YearsWithCurrManager: 8,
        JobSatisfaction: '4',
        EnvironmentSatisfaction: '4',
        JobInvolvement: '4'
    };

    function applyProfile(profile) {
        Object.entries(profile).forEach(([key, val]) => {
            const field = form.elements[key];
            if (field) {
                field.value = val;
            }
        });
    }

    if (loadHighRiskBtn) {
        loadHighRiskBtn.addEventListener('click', () => {
            applyProfile(highRiskProfile);
            form.requestSubmit();
        });
    }

    if (loadLowRiskBtn) {
        loadLowRiskBtn.addEventListener('click', () => {
            applyProfile(lowRiskProfile);
            form.requestSubmit();
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            form.reset();
            placeholderState.classList.remove('hidden');
            outputContent.classList.add('hidden');
            statusBadge.className = 'badge badge-neutral';
            statusBadge.textContent = 'Awaiting Input';
        });
    }

    // Form Submit Handler
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // UI loading state
        submitBtn.disabled = true;
        btnText.textContent = 'Calculating...';
        btnSpinner.classList.remove('hidden');

        // Collect Form Data into JSON
        const formData = new FormData(form);
        const payload = {};
        formData.forEach((value, key) => {
            if (key !== 'csrfmiddlewaretoken') {
                payload[key] = value;
            }
        });

        try {
            const response = await fetch(form.action, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.success) {
                renderResult(result.data);
            } else {
                alert(`Prediction Error: ${result.error || 'Unable to compute prediction.'}`);
            }
        } catch (err) {
            console.error('Inference error:', err);
            alert('A network error occurred while connecting to the model server.');
        } finally {
            submitBtn.disabled = false;
            btnText.textContent = '🔍 Predict Attrition';
            btnSpinner.classList.add('hidden');
        }
    });

    // Render output
    function renderResult(data) {
        // Toggle view
        placeholderState.classList.add('hidden');
        outputContent.classList.remove('hidden');

        const isLeave = data.prediction_code === 1;

        // Badge update
        statusBadge.className = isLeave ? 'badge badge-danger' : 'badge badge-success';
        statusBadge.textContent = isLeave ? 'Attrition Risk Detected' : 'Employee Retained';

        // Verdict Banner
        verdictBanner.className = `verdict-banner ${isLeave ? 'danger' : 'success'}`;
        verdictIcon.textContent = isLeave ? '⚠️' : '✅';
        verdictTitle.textContent = isLeave ? 'Likely to Leave (Yes)' : 'Likely to Stay (No)';
        verdictDesc.textContent = isLeave
            ? 'Based on Logistic Regression analysis, the employee exhibits factors heavily associated with attrition.'
            : 'Based on Logistic Regression analysis, the employee exhibits high stability factors and is likely to remain.';

        // Probabilities
        leaveProbText.textContent = `${data.leave_probability}%`;
        leaveProbBar.style.width = `${data.leave_probability}%`;

        stayProbText.textContent = `${data.stay_probability}%`;
        stayProbBar.style.width = `${data.stay_probability}%`;

        // Details
        modelClassCode.textContent = `${data.attrition} (${data.prediction_code})`;
        riskCategoryText.textContent = data.risk_level;
        riskCategoryText.style.color = isLeave ? '#b91c1c' : '#047857';

        const algorithmEl = document.getElementById('algorithmText');
        if (algorithmEl && data.algorithm) {
            algorithmEl.textContent = data.algorithm;
        }

        // Smooth scroll for small screens
        if (window.innerWidth <= 1024) {
            outputContent.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
});
