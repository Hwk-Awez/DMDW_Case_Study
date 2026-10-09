/**
 * AttritionIQ - High Performance Modern Interactive & Motion Engine
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const form = document.getElementById('predictionForm');
    const submitBtn = document.getElementById('submitBtn');
    const submitBtnText = document.getElementById('submitBtnText');
    const submitSpinner = document.getElementById('submitSpinner');
    const resetBtn = document.getElementById('resetBtn');
    const livePredictToggle = document.getElementById('livePredictToggle');

    // Theme Elements
    const themeToggle = document.getElementById('themeToggle');
    const htmlElement = document.documentElement;

    // Presets
    const presetHighRisk = document.getElementById('presetHighRisk');
    const presetLowRisk = document.getElementById('presetLowRisk');
    const presetAverage = document.getElementById('presetAverage');

    // Benchmark Modal Elements
    const openBenchmarkBtn = document.getElementById('openBenchmarkBtn');
    const closeBenchmarkBtn = document.getElementById('closeBenchmarkBtn');
    const benchmarkModal = document.getElementById('benchmarkModal');

    // Dynamic Result Display Elements
    const resultCard = document.getElementById('resultCard');
    const riskBadge = document.getElementById('riskBadge');
    const gaugeContainer = document.querySelector('.radial-gauge-container');
    const gaugeCircle = document.getElementById('gaugeCircle');
    const gaugePercentage = document.getElementById('gaugePercentage');
    const verdictBanner = document.getElementById('verdictBanner');
    const verdictIcon = document.getElementById('verdictIcon');
    const verdictHeading = document.getElementById('verdictHeading');
    const verdictDetails = document.getElementById('verdictDetails');
    const leavePctLabel = document.getElementById('leavePctLabel');
    const stayPctLabel = document.getElementById('stayPctLabel');
    const dualLeaveFill = document.getElementById('dualLeaveFill');
    const dualStayFill = document.getElementById('dualStayFill');
    const targetClassCode = document.getElementById('targetClassCode');
    const riskSeverityLabel = document.getElementById('riskSeverityLabel');
    const factorTags = document.getElementById('factorTags');

    // Continuous & Range Input Sync
    const ageSlider = document.getElementById('Age');
    const ageVal = document.getElementById('ageVal');

    const distanceSlider = document.getElementById('DistanceFromHome');
    const distanceVal = document.getElementById('distanceVal');

    const incomeSlider = document.getElementById('MonthlyIncome');
    const incomeDisplay = document.getElementById('incomeDisplay');

    const managerSlider = document.getElementById('YearsWithCurrManager');
    const managerTenureVal = document.getElementById('managerTenureVal');

    const totalExpInput = document.getElementById('TotalWorkingYears');
    const totalExpVal = document.getElementById('totalExpVal');

    const companyTenureInput = document.getElementById('YearsAtCompany');
    const companyTenureVal = document.getElementById('companyTenureVal');

    // OverTime Toggle
    const overTimeToggle = document.getElementById('overTimeToggle');
    const overTimeInput = document.getElementById('OverTime');
    const overTimePill = document.getElementById('overTimePill');

    // Job Level Tag
    const jobLevelDesc = document.getElementById('jobLevelDesc');
    const jobLevelDescriptions = {
        '1': 'Level 1: Entry Level / Apprentice',
        '2': 'Level 2: Mid-Level Specialist',
        '3': 'Level 3: Senior Contributor',
        '4': 'Level 4: Team Lead / Manager',
        '5': 'Level 5: Executive Director'
    };

    // Rating Descriptions
    const ratingLabels = {
        1: 'Low (1/4)',
        2: 'Medium (2/4)',
        3: 'High (3/4)',
        4: 'Very High (4/4)'
    };

    let debounceTimer = null;
    let currentLeavePct = 0;
    const GAUGE_CIRCUMFERENCE = 427; // 2 * PI * 68

    /* ==========================================================================
       1. Theme Management
       ========================================================================== */
    const savedTheme = localStorage.getItem('attrition_theme') || 'dark';
    htmlElement.setAttribute('data-theme', savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('attrition_theme', newTheme);
    });

    /* ==========================================================================
       2. Modal Controls
       ========================================================================== */
    if (openBenchmarkBtn && benchmarkModal && closeBenchmarkBtn) {
        openBenchmarkBtn.addEventListener('click', () => {
            benchmarkModal.classList.remove('hidden');
        });

        closeBenchmarkBtn.addEventListener('click', () => {
            benchmarkModal.classList.add('hidden');
        });

        benchmarkModal.addEventListener('click', (e) => {
            if (e.target === benchmarkModal) {
                benchmarkModal.classList.add('hidden');
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !benchmarkModal.classList.contains('hidden')) {
                benchmarkModal.classList.add('hidden');
            }
        });
    }

    /* ==========================================================================
       3. Input Synchronizations & Micro-Interactions
       ========================================================================== */
    function triggerBounce(element) {
        element.style.transform = 'scale(1.15)';
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 150);
    }

    ageSlider.addEventListener('input', (e) => {
        ageVal.textContent = e.target.value;
        triggerBounce(ageVal);
        triggerAutoPredict();
    });

    distanceSlider.addEventListener('input', (e) => {
        distanceVal.textContent = `${e.target.value} km`;
        triggerBounce(distanceVal);
        triggerAutoPredict();
    });

    incomeSlider.addEventListener('input', (e) => {
        incomeDisplay.textContent = `$${Number(e.target.value).toLocaleString()} / mo`;
        triggerAutoPredict();
    });

    managerSlider.addEventListener('input', (e) => {
        managerTenureVal.textContent = `${e.target.value} yrs`;
        triggerBounce(managerTenureVal);
        triggerAutoPredict();
    });

    totalExpInput.addEventListener('input', (e) => {
        totalExpVal.textContent = `${e.target.value} yrs`;
        triggerBounce(totalExpVal);
        triggerAutoPredict();
    });

    companyTenureInput.addEventListener('input', (e) => {
        companyTenureVal.textContent = `${e.target.value} yrs`;
        triggerBounce(companyTenureVal);
        triggerAutoPredict();
    });

    // Stepper Buttons (+ / -)
    document.querySelectorAll('.stepper-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            const step = parseInt(btn.dataset.step, 10);
            const input = document.getElementById(targetId);
            if (input) {
                let current = parseInt(input.value, 10) || 0;
                let min = parseInt(input.min, 10) || 0;
                let max = parseInt(input.max, 10) || 45;
                let updated = Math.min(Math.max(current + step, min), max);
                input.value = updated;
                input.dispatchEvent(new Event('input'));
            }
        });
    });

    // OverTime Toggle Switch
    overTimeToggle.addEventListener('change', () => {
        const isOT = overTimeToggle.checked;
        overTimeInput.value = isOT ? 'Yes' : 'No';
        if (isOT) {
            overTimePill.className = 'overtime-status-pill warning';
            overTimePill.querySelector('.ot-text').textContent = 'OverTime: Yes (High Burnout Risk)';
        } else {
            overTimePill.className = 'overtime-status-pill safe';
            overTimePill.querySelector('.ot-text').textContent = 'OverTime: No (Standard Workload)';
        }
        triggerAutoPredict();
    });

    // Job Level Pill Group
    document.querySelectorAll('input[name="JobLevel"]').forEach(radio => {
        radio.addEventListener('change', () => {
            jobLevelDesc.textContent = jobLevelDescriptions[radio.value] || `Level ${radio.value}`;
            triggerAutoPredict();
        });
    });

    // Radio Listeners for auto-predict
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', () => {
            triggerAutoPredict();
        });
    });

    document.getElementById('JobRole').addEventListener('change', () => {
        triggerAutoPredict();
    });

    // Rating Buttons (1 to 4)
    document.querySelectorAll('.rating-pills').forEach(container => {
        const fieldName = container.dataset.field;
        const hiddenInput = document.getElementById(fieldName);
        const feedbackEl = container.parentElement.querySelector('.sentiment-feedback');

        container.querySelectorAll('.rate-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('.rate-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const val = btn.dataset.val;
                hiddenInput.value = val;
                if (feedbackEl) {
                    feedbackEl.textContent = ratingLabels[val];
                }
                triggerAutoPredict();
            });
        });
    });

    /* ==========================================================================
       4. Persona Profiles
       ========================================================================== */
    const profiles = {
        highRisk: {
            Age: 25,
            DistanceFromHome: 28,
            MaritalStatus: 'Single',
            JobRole: 'Sales Representative',
            JobLevel: '1',
            BusinessTravel: 'Travel_Frequently',
            OverTime: 'Yes',
            MonthlyIncome: 2300,
            StockOptionLevel: '0',
            TotalWorkingYears: 2,
            YearsAtCompany: 1,
            YearsWithCurrManager: 0,
            JobSatisfaction: 1,
            EnvironmentSatisfaction: 1,
            JobInvolvement: 1
        },
        lowRisk: {
            Age: 48,
            DistanceFromHome: 3,
            MaritalStatus: 'Married',
            JobRole: 'Manager',
            JobLevel: '4',
            BusinessTravel: 'Non-Travel',
            OverTime: 'No',
            MonthlyIncome: 14800,
            StockOptionLevel: '2',
            TotalWorkingYears: 22,
            YearsAtCompany: 12,
            YearsWithCurrManager: 8,
            JobSatisfaction: 4,
            EnvironmentSatisfaction: 4,
            JobInvolvement: 4
        },
        average: {
            Age: 34,
            DistanceFromHome: 9,
            MaritalStatus: 'Married',
            JobRole: 'Research Scientist',
            JobLevel: '2',
            BusinessTravel: 'Travel_Rarely',
            OverTime: 'No',
            MonthlyIncome: 5400,
            StockOptionLevel: '1',
            TotalWorkingYears: 8,
            YearsAtCompany: 4,
            YearsWithCurrManager: 3,
            JobSatisfaction: 3,
            EnvironmentSatisfaction: 3,
            JobInvolvement: 3
        }
    };

    function applyProfile(data) {
        // Continuous Inputs
        ageSlider.value = data.Age;
        ageSlider.dispatchEvent(new Event('input'));

        distanceSlider.value = data.DistanceFromHome;
        distanceSlider.dispatchEvent(new Event('input'));

        incomeSlider.value = data.MonthlyIncome;
        incomeSlider.dispatchEvent(new Event('input'));

        managerSlider.value = data.YearsWithCurrManager;
        managerSlider.dispatchEvent(new Event('input'));

        totalExpInput.value = data.TotalWorkingYears;
        totalExpInput.dispatchEvent(new Event('input'));

        companyTenureInput.value = data.YearsAtCompany;
        companyTenureInput.dispatchEvent(new Event('input'));

        // Radios
        const setRadio = (name, val) => {
            const el = form.querySelector(`input[name="${name}"][value="${val}"]`);
            if (el) {
                el.checked = true;
                el.dispatchEvent(new Event('change'));
            }
        };

        setRadio('MaritalStatus', data.MaritalStatus);
        setRadio('JobLevel', data.JobLevel);
        setRadio('BusinessTravel', data.BusinessTravel);
        setRadio('StockOptionLevel', data.StockOptionLevel);

        // Select
        document.getElementById('JobRole').value = data.JobRole;

        // OverTime
        const isOT = data.OverTime === 'Yes';
        overTimeToggle.checked = isOT;
        overTimeToggle.dispatchEvent(new Event('change'));

        // Sentiment ratings
        const setRating = (fieldName, val) => {
            const container = document.querySelector(`.rating-pills[data-field="${fieldName}"]`);
            if (container) {
                const targetBtn = container.querySelector(`.rate-btn[data-val="${val}"]`);
                if (targetBtn) targetBtn.click();
            }
        };

        setRating('JobSatisfaction', data.JobSatisfaction);
        setRating('EnvironmentSatisfaction', data.EnvironmentSatisfaction);
        setRating('JobInvolvement', data.JobInvolvement);

        executePrediction();
    }

    if (presetHighRisk) presetHighRisk.addEventListener('click', () => applyProfile(profiles.highRisk));
    if (presetLowRisk) presetLowRisk.addEventListener('click', () => applyProfile(profiles.lowRisk));
    if (presetAverage) presetAverage.addEventListener('click', () => applyProfile(profiles.average));

    // Reset Form
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            applyProfile(profiles.average);
        });
    }

    /* ==========================================================================
       5. Number Counter Animation
       ========================================================================== */
    function animateNumber(element, start, end, duration = 400, suffix = '') {
        const startTime = performance.now();
        const diff = end - start;

        function step(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const ease = 1 - Math.pow(1 - progress, 3);
            const currentVal = Math.round(start + diff * ease);
            element.textContent = `${currentVal}${suffix}`;
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                element.textContent = `${Math.round(end)}${suffix}`;
            }
        }
        requestAnimationFrame(step);
    }

    /* ==========================================================================
       6. Prediction Engine (API Call + Animation)
       ========================================================================== */
    function triggerAutoPredict() {
        if (!livePredictToggle.checked) return;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            executePrediction();
        }, 200);
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        executePrediction();
    });

    async function executePrediction() {
        submitBtn.disabled = true;
        submitSpinner.classList.remove('hidden');
        submitBtnText.textContent = 'Calculating...';

        // Add calculating radar scan-beam effect to the result dashboard
        if (resultCard) resultCard.classList.add('is-calculating');

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
                updateDashboard(result.data, payload);
            } else {
                console.error('Inference error:', result.error);
            }
        } catch (err) {
            console.error('Network error during prediction:', err);
        } finally {
            submitBtn.disabled = false;
            submitSpinner.classList.add('hidden');
            submitBtnText.textContent = 'Run Prediction Model';
            if (resultCard) {
                setTimeout(() => resultCard.classList.remove('is-calculating'), 300);
            }
        }
    }

    /* ==========================================================================
       7. Live Dashboard Update with Motion
       ========================================================================== */
    function updateDashboard(data, inputs) {
        const leavePct = Number(data.leave_probability);
        const stayPct = Number(data.stay_probability);
        const isLeave = data.prediction_code === 1;

        // Smooth Counter Animation on Gauge
        animateNumber(gaugePercentage, currentLeavePct, leavePct, 450, '%');
        currentLeavePct = leavePct;

        // Circular Radial Gauge Stroke Offset Animation
        const offset = GAUGE_CIRCUMFERENCE - (leavePct / 100) * GAUGE_CIRCUMFERENCE;
        gaugeCircle.style.strokeDashoffset = offset;

        // Color theme for gauge and status
        let themeColor = '#10b981';
        let badgeClass = 'status-badge success';
        let badgeText = 'Retained · Stable';
        let bannerClass = 'verdict-card success';

        if (leavePct >= 60) {
            themeColor = '#f43f5e';
            badgeClass = 'status-badge danger';
            badgeText = 'High Flight Risk';
            bannerClass = 'verdict-card danger';
            if (gaugeContainer) {
                gaugeContainer.classList.add('danger-pulse');
                gaugeContainer.classList.remove('safe-pulse');
            }
        } else if (leavePct >= 35) {
            themeColor = '#f59e0b';
            badgeClass = 'status-badge warning';
            badgeText = 'Moderate Watch';
            bannerClass = 'verdict-card warning';
            if (gaugeContainer) {
                gaugeContainer.classList.remove('danger-pulse', 'safe-pulse');
            }
        } else {
            if (gaugeContainer) {
                gaugeContainer.classList.add('safe-pulse');
                gaugeContainer.classList.remove('danger-pulse');
            }
        }

        gaugeCircle.style.stroke = themeColor;
        riskBadge.className = badgeClass;
        riskBadge.textContent = badgeText;

        // Outcome Verdict Banner with Bouncing Icon
        verdictBanner.className = bannerClass;
        verdictIcon.textContent = isLeave ? '🚨' : (leavePct >= 35 ? '⚠️' : '🛡️');
        
        // Trigger icon bounce animation
        verdictIcon.classList.remove('icon-bounce');
        void verdictIcon.offsetWidth; // Force DOM reflow
        verdictIcon.classList.add('icon-bounce');

        verdictHeading.textContent = isLeave ? 'Likely to Leave (Attrition: Yes)' : 'Likely to Stay (Attrition: No)';
        verdictDetails.textContent = isLeave
            ? 'Logistic Regression predicts this employee is at high risk of attrition based on workload and engagement factors.'
            : 'Employee exhibits positive stability indicators. Predicted to remain with current team and role.';

        // Duel Probability Bar
        leavePctLabel.textContent = `${leavePct}%`;
        stayPctLabel.textContent = `${stayPct}%`;
        dualLeaveFill.style.width = `${leavePct}%`;
        dualStayFill.style.width = `${stayPct}%`;

        // Metric Chips
        targetClassCode.textContent = `${data.attrition} (Code: ${data.prediction_code})`;
        riskSeverityLabel.textContent = data.risk_level;
        riskSeverityLabel.style.color = themeColor;

        // Render Dynamic Key Signal Insights Tags with Staggered Pop-In
        renderInsightTags(inputs, leavePct);
    }

    function renderInsightTags(inputs, leavePct) {
        factorTags.innerHTML = '';

        const tags = [];

        // Overtime check
        if (inputs.OverTime === 'Yes') {
            tags.push({ text: '⚡ OverTime Active (+Risk)', type: 'warning' });
        } else {
            tags.push({ text: '☕ No OverTime (-Risk)', type: 'positive' });
        }

        // Job Satisfaction
        const jobSat = parseInt(inputs.JobSatisfaction, 10);
        if (jobSat === 1) {
            tags.push({ text: '😞 Critical Low Job Satisfaction', type: 'warning' });
        } else if (jobSat >= 3) {
            tags.push({ text: '😊 High Job Satisfaction', type: 'positive' });
        }

        // Environment Satisfaction
        const envSat = parseInt(inputs.EnvironmentSatisfaction, 10);
        if (envSat === 1) {
            tags.push({ text: '🏢 Poor Work Environment', type: 'warning' });
        }

        // Monthly Income
        const income = parseFloat(inputs.MonthlyIncome);
        if (income < 3000) {
            tags.push({ text: '📉 Below Average Salary', type: 'warning' });
        } else if (income > 10000) {
            tags.push({ text: '💵 High Compensation Package', type: 'positive' });
        }

        // Commute
        const dist = parseFloat(inputs.DistanceFromHome);
        if (dist >= 20) {
            tags.push({ text: `🚗 Extended Commute (${dist} km)`, type: 'warning' });
        }

        // Stock Options
        const stock = parseInt(inputs.StockOptionLevel, 10);
        if (stock >= 1) {
            tags.push({ text: `📈 Equity Options (Tier ${stock})`, type: 'positive' });
        } else {
            tags.push({ text: 'Tier 0 Stock Grants', type: 'neutral' });
        }

        // Manager Relationship
        const mgrYears = parseFloat(inputs.YearsWithCurrManager);
        if (mgrYears >= 4) {
            tags.push({ text: `🤝 Established Manager (${mgrYears}y)`, type: 'positive' });
        } else if (mgrYears === 0) {
            tags.push({ text: '👤 New Manager Transition', type: 'neutral' });
        }

        // Travel
        if (inputs.BusinessTravel === 'Travel_Frequently') {
            tags.push({ text: '✈️ High Travel Strain', type: 'warning' });
        }

        // Append to DOM with Staggered Delay
        tags.forEach((t, idx) => {
            const span = document.createElement('span');
            span.className = `factor-tag tag-${t.type}`;
            span.textContent = t.text;
            span.style.animationDelay = `${idx * 40}ms`;
            factorTags.appendChild(span);
        });
    }

    // Initial Prediction Run on page load
    triggerAutoPredict();
});
