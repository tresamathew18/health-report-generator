
import React, { useState, useEffect, useRef } from 'react';

const BMICalculator = ({ darkMode, setDarkMode }) => {
  const [unit, setUnit] = useState('metric');
  const [gender, setGender] = useState('female');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [activity, setActivity] = useState('sedentary');
  const [bmi, setBMI] = useState(null);
  const [displayBMI, setDisplayBMI] = useState(0);
  const [message, setMessage] = useState('');
  const [isCalculated, setIsCalculated] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [idealWeight, setIdealWeight] = useState({ min: 0, max: 0 });
  const [results, setResults] = useState({});
  const animRef = useRef(null);
  const d = darkMode;

  const activityLevels = [
    { value: 'sedentary', label: 'Sedentary', multiplier: 1.2, desc: 'Little or no exercise' },
    { value: 'light', label: 'Lightly Active', multiplier: 1.375, desc: 'Exercise 1-3 days/week' },
    { value: 'moderate', label: 'Moderately Active', multiplier: 1.55, desc: 'Exercise 3-5 days/week' },
    { value: 'active', label: 'Very Active', multiplier: 1.725, desc: 'Exercise 6-7 days/week' },
    { value: 'extra', label: 'Extra Active', multiplier: 1.9, desc: 'Very hard exercise daily' },
  ];

  useEffect(() => {
    if (bmi !== null) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 500);
      const target = parseFloat(bmi);
      const steps = 60;
      const increment = target / steps;
      let current = 0;
      let step = 0;

      if (animRef.current) clearInterval(animRef.current);

      animRef.current = setInterval(() => {
        step++;
        current += increment;
        if (step >= steps) {
          setDisplayBMI(target.toFixed(1));
          clearInterval(animRef.current);
        } else {
          setDisplayBMI(current.toFixed(1));
        }
      }, 1000 / steps);

      return () => clearTimeout(timer);
    }
  }, [bmi]);

  const getCategory = (v) => {
    if (v < 18.5) return 'Underweight';
    if (v < 25) return 'Normal weight';
    if (v < 30) return 'Overweight';
    return 'Obese';
  };

  const getGenderNote = (v) => {
    if (gender === 'female') {
      if (v < 18.5) return 'Women naturally carry more body fat — being underweight can affect hormonal health.';
      if (v < 25) return 'This is a healthy BMI range for women. Healthy body fat for women is 20–35%.';
      if (v < 30) return 'Women are at increased risk of health issues above 25% body fat.';
      return 'Consult a doctor. Obesity in women is linked to hormonal and cardiovascular risks.';
    } else {
      if (v < 18.5) return 'Men with low BMI may have reduced muscle mass and bone density.';
      if (v < 25) return 'This is a healthy BMI range for men. Healthy body fat for men is 10–25%.';
      if (v < 30) return 'Men above BMI 25 have increased risk of heart disease and diabetes.';
      return 'Consult a doctor. Obesity in men is strongly linked to cardiovascular disease.';
    }
  };

  const getFitnessAge = (bmiValue, actualAge) => {
    // Fitness age based on BMI deviation from ideal (22) and actual age
    const idealBMI = 22;
    const bmiDiff = bmiValue - idealBMI;
    let agePenalty = 0;

    if (bmiDiff > 0) agePenalty = bmiDiff * 1.5; // overweight ages you
    else if (bmiDiff < 0) agePenalty = bmiDiff * 1.0; // underweight also ages you

    // Activity bonus
    const actLevel = activityLevels.find(l => l.value === activity);
    const activityBonus = (actLevel.multiplier - 1.2) * 8; // more active = younger
    const fitnessAge = Math.round(actualAge + agePenalty - activityBonus);
    const diff = fitnessAge - actualAge;
    let status, color, message;

    if (diff <= -5) {
      status = 'Excellent';
      color = '#639922';
      message = `Your body is ${Math.abs(diff)} years younger than your actual age!`;
    } else if (diff <= -2) {
      status = 'Good';
      color = '#5dcaa5';
      message = `Your body is ${Math.abs(diff)} years younger than your actual age.`;
    } else if (diff <= 2) {
      status = 'Average';
      color = '#BA7517';
      message = 'Your fitness age matches your actual age.';
    } else if (diff <= 5) {
      status = 'Below Avg';
      color = '#E24B4A';
      message = `Your body is ${diff} years older than your actual age.`;
    } else {
      status = 'Poor';
      color = '#A32D2D';
      message = `Your body is ${diff} years older than your actual age. Time to make changes!`;
    }

    return { fitnessAge: Math.max(1, fitnessAge), status, color, message, diff };
  };

  const calculateAll = (e) => {
    e.preventDefault();

    if (!height || !weight || !age || height <= 0 || weight <= 0 || age <= 0) {
      alert("Please enter valid height, weight and age!");
      return;
    }

    let h = parseFloat(height);
    let w = parseFloat(weight);
    let a = parseFloat(age);
    let hM = unit === 'metric' ? h : h * 0.0254;
    let wKg = unit === 'metric' ? w : w * 0.453592;
    let hCm = hM * 100;

    // BMI
    let bmiValue = wKg / (hM * hM);
    setBMI(bmiValue.toFixed(1));
    setIsCalculated(true);
    setMessage(getCategory(bmiValue));

    // Ideal weight
    let minW = unit === 'metric'
      ? (18.5 * hM * hM).toFixed(1)
      : ((18.5 * hM * hM) / 0.453592).toFixed(1);

    let maxW = unit === 'metric'
      ? (24.9 * hM * hM).toFixed(1)
      : ((24.9 * hM * hM) / 0.453592).toFixed(1);

    setIdealWeight({ min: minW, max: maxW });

    // BMR (Mifflin-St Jeor)
    let bmr = gender === 'female'
      ? (10 * wKg) + (6.25 * hCm) - (5 * a) - 161
      : (10 * wKg) + (6.25 * hCm) - (5 * a) + 5;

    // TDEE
    const actLevel = activityLevels.find(l => l.value === activity);
    const tdee = bmr * actLevel.multiplier;

    // Body Fat % (Deurenberg)
    let bodyFat = (1.2 * bmiValue) + (0.23 * a) - (10.8 * (gender === 'male' ? 1 : 0)) - 5.4;
    bodyFat = Math.max(0, bodyFat);

    // Fitness Age
    const fitnessAgeData = getFitnessAge(bmiValue, a);

    setResults({
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      activityLabel: actLevel.label,
      bodyFat: bodyFat.toFixed(1),
      fitnessAge: fitnessAgeData,
      weightToLose: bmiValue > 25 ? (wKg - (24.9 * hM * hM)).toFixed(1) : null,
      weightToGain: bmiValue < 18.5 ? ((18.5 * hM * hM) - wKg).toFixed(1) : null,
    });
  };

  const resetForm = () => {
    setHeight('');
    setWeight('');
    setAge('');
    setBMI(null);
    setDisplayBMI(0);
    setMessage('');
    setIsCalculated(false);
    setIsAnimating(false);
    setIdealWeight({ min: 0, max: 0 });
    setResults({});
    setActivity('sedentary');
  };

  const getBMIColor = () => {
    if (!bmi) return 'text-pink-300';
    const v = parseFloat(bmi);
    if (v < 18.5) return 'text-blue-400';
    if (v < 25) return 'text-green-400';
    if (v < 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getCategoryStyle = () => {
    if (!bmi) return { bg: d ? '#3d1a2e' : '#fbeaf0', text: d ? '#f4c0d1' : '#9b2252' };
    const v = parseFloat(bmi);
    if (v < 18.5) return { bg: d ? '#0c2340' : '#e6f1fb', text: d ? '#85b7eb' : '#0c447c' };
    if (v < 25) return { bg: d ? '#0f2d1a' : '#eaf3de', text: d ? '#97c459' : '#27500a' };
    if (v < 30) return { bg: d ? '#2d1f00' : '#faeeda', text: d ? '#ef9f27' : '#633806' };
    return { bg: d ? '#2d0a0a' : '#fcebeb', text: d ? '#f09595' : '#791f1f' };
  };

  const getHealthTips = () => {
    const v = parseFloat(bmi);

    if (v < 18.5) return gender === 'female' ? [
      'Eat calorie-dense foods like avocado, nuts and dairy',
      'Strength training helps build muscle and healthy weight',
      'Low BMI can affect your menstrual cycle — see a doctor',
    ] : [
      'Eat calorie-dense foods like nuts, whole grains and lean meats',
      'Focus on strength training to build muscle mass',
      'Consult a nutritionist for a personalised meal plan',
    ];

    if (v < 25) return gender === 'female' ? [
      'You are in a healthy range — keep it up!',
      'Stay active with 30 mins of movement daily',
      'Focus on strength, flexibility and mental wellbeing',
    ] : [
      'You are in a healthy range — great work!',
      'Maintain with regular cardio and strength training',
      'Keep a balanced diet rich in protein and vegetables',
    ];

    if (v < 30) return gender === 'female' ? [
      'Try 30 mins of cardio like dancing, walking or cycling',
      'Reduce processed foods and sugary drinks',
      'Hormonal changes can affect weight — consider speaking to a doctor',
    ] : [
      'Add 30 mins of cardio daily — running, cycling or swimming',
      'Reduce alcohol, processed foods and sugary drinks',
      'Aim for gradual weight loss of 0.5kg per week',
    ];

    return gender === 'female' ? [
      'Speak to a doctor about a safe weight management plan',
      'Low-impact exercises like swimming or yoga are great starting points',
      'Obesity can affect fertility and hormonal health in women',
    ] : [
      'Consult a doctor for a personalised weight management plan',
      'Start with low-impact exercises like walking or swimming',
      'Obesity in men significantly raises cardiovascular disease risk',
    ];
  };

  const scalePercent = bmi
    ? Math.min(Math.max(((parseFloat(bmi) - 10) / 30) * 100, 0), 100)
    : 0;

  const { bg: catBg, text: catText } = getCategoryStyle();
  const cardBg = d ? '#1e0a14' : '#fff0f5';
  const cardBorder = d ? '#5a1a35' : '#f4c0d1';
  const sectionBg = d ? '#2a0f1e' : '#fbeaf0';
  const titleColor = d ? '#f4c0d1' : '#7f1d3e';
  const subColor = d ? '#c084a0' : '#ec4899';
  const labelColor = d ? '#f4c0d1' : '#9b2252';
  const inputBg = d ? '#12060e' : '#fff';
  const inputText = d ? '#f4c0d1' : '#7f1d3e';
  const btnGradient = 'linear-gradient(135deg, #d4537e, #ed93b1)';
  const toggleBg = d ? '#2a0f1e' : '#fbeaf0';
  const resultText = d ? '#e8a0b8' : '#9b2252';

  const InfoCard = ({ title, children }) => (
    <div
      className="rounded-xl p-3 mb-4 text-left"
      style={{ background: sectionBg, border: `1px solid ${cardBorder}` }}
    >
      <p className="text-xs font-semibold mb-2" style={{ color: labelColor }}>
        {title}
      </p>
      {children}
    </div>
  );

  return (
    <div
      className="w-full max-w-sm p-7 rounded-3xl shadow-lg text-center"
      style={{
        background: cardBg,
        border: `1.5px solid ${cardBorder}`,
        transition: 'all 0.5s ease'
      }}
    >
      {/* Header */}
      <div className="flex justify-end mb-1">
        <button
          onClick={() => setDarkMode(!d)}
          className="text-lg px-2 py-1 rounded-full transition-all duration-300"
          style={{ background: sectionBg, border: `1px solid ${cardBorder}` }}
        >
          {d ? '☀️' : '🌙'}
        </button>
      </div>

      <div className="text-lg tracking-widest text-pink-300 mb-1">✿ ✿ ✿</div>
      <h1 className="text-2xl font-bold mb-1" style={{ color: titleColor }}>
        BMI Calculator
      </h1>
      <p className="text-xs mb-6" style={{ color: subColor }}>
        Know your body, love yourself
      </p>

      {/* Gender Toggle */}
      <div
        className="flex rounded-full p-1 mb-4"
        style={{ background: toggleBg, border: `1px solid ${cardBorder}` }}
      >
        {['female', 'male'].map(g => (
          <button
            key={g}
            type="button"
            onClick={() => { setGender(g); resetForm(); }}
            className="flex-1 py-2 rounded-full text-sm font-medium transition-all duration-200"
            style={gender === g
              ? { background: btnGradient, color: '#fff' }
              : { color: labelColor, background: 'transparent' }}
          >
            {g.charAt(0).toUpperCase() + g.slice(1)}
          </button>
        ))}
      </div>

      {/* Unit Toggle */}
      <div
        className="flex rounded-full p-1 mb-6"
        style={{ background: toggleBg, border: `1px solid ${cardBorder}` }}
      >
        {[
          ['metric', 'Metric (m, kg)'],
          ['imperial', 'Imperial (in, lbs)']
        ].map(([val, label]) => (
          <button
            key={val}
            type="button"
            onClick={() => { setUnit(val); resetForm(); }}
            className="flex-1 py-2 rounded-full text-sm font-medium transition-all duration-200"
            style={unit === val
              ? { background: btnGradient, color: '#fff' }
              : { color: labelColor, background: 'transparent' }}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={calculateAll} className="mb-2">
        {/* Height */}
        <div className="mb-4 text-left">
          <label className="block text-sm font-medium mb-1" style={{ color: labelColor }}>
            Height
          </label>
          <div className="relative">
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              step="0.01"
              placeholder={unit === 'metric' ? 'e.g. 1.65' : 'e.g. 65'}
              className="w-full px-4 py-2.5 pr-14 rounded-2xl text-sm outline-none"
              style={{
                background: inputBg,
                border: `1.5px solid ${cardBorder}`,
                color: inputText
              }}
              onFocus={e => e.target.style.borderColor = '#d4537e'}
              onBlur={e => e.target.style.borderColor = cardBorder}
              required
            />
            <span
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold"
              style={{ color: subColor }}
            >
              {unit === 'metric' ? 'm' : 'in'}
            </span>
          </div>
        </div>

        {/* Weight */}
        <div className="mb-4 text-left">
          <label className="block text-sm font-medium mb-1" style={{ color: labelColor }}>
            Weight
          </label>
          <div className="relative">
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              step="0.1"
              placeholder={unit === 'metric' ? 'e.g. 60' : 'e.g. 132'}
              className="w-full px-4 py-2.5 pr-14 rounded-2xl text-sm outline-none"
              style={{
                background: inputBg,
                border: `1.5px solid ${cardBorder}`,
                color: inputText
              }}
              onFocus={e => e.target.style.borderColor = '#d4537e'}
              onBlur={e => e.target.style.borderColor = cardBorder}
              required
            />
            <span
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold"
              style={{ color: subColor }}
            >
              {unit === 'metric' ? 'kg' : 'lbs'}
            </span>
          </div>
        </div>

        {/* Age */}
        <div className="mb-4 text-left">
          <label className="block text-sm font-medium mb-1" style={{ color: labelColor }}>
            Age
          </label>
          <div className="relative">
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              step="1"
              placeholder="e.g. 21"
              min="1"
              max="120"
              className="w-full px-4 py-2.5 pr-16 rounded-2xl text-sm outline-none"
              style={{
                background: inputBg,
                border: `1.5px solid ${cardBorder}`,
                color: inputText
              }}
              onFocus={e => e.target.style.borderColor = '#d4537e'}
              onBlur={e => e.target.style.borderColor = cardBorder}
              required
            />
            <span
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold"
              style={{ color: subColor }}
            >
              years
            </span>
          </div>
        </div>

        {/* Activity Level */}
        <div className="mb-6 text-left">
          <label className="block text-sm font-medium mb-1" style={{ color: labelColor }}>
            Activity Level
          </label>
          <select
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            className="w-full px-4 py-2.5 rounded-2xl text-sm outline-none"
            style={{
              background: inputBg,
              border: `1.5px solid ${cardBorder}`,
              color: inputText
            }}
          >
            {activityLevels.map(l => (
              <option key={l.value} value={l.value}>
                {l.label} — {l.desc}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-full text-white text-sm font-semibold shadow-md transition-all duration-200 hover:opacity-90 hover:scale-105 active:scale-95"
          style={{ background: btnGradient }}
        >
          Calculate
        </button>
      </form>

      {/* Result Panel */}
      {isCalculated && (
        <div className={`transition-all duration-500 transform mt-5 ${
          isAnimating ? 'scale-105 opacity-90' : 'scale-100 opacity-100'
        }`}>
          <div
            className="rounded-2xl p-5"
            style={{
              background: d ? '#12060e' : '#fff',
              border: `1.5px solid ${cardBorder}`
            }}
          >
            {/* BMI Value */}
            <div className={`text-5xl font-bold mb-1 ${getBMIColor()}`}>
              {displayBMI}
            </div>
            <p className="text-xs mb-3" style={{ color: subColor }}>
              Your BMI
            </p>

            <span
              className="inline-block px-5 py-1.5 rounded-full text-sm font-medium mb-4"
              style={{ background: catBg, color: catText }}
            >
              {message}
            </span>

            {/* Scale Bar */}
            <div
              className="h-2 rounded-full overflow-hidden mb-2"
              style={{ background: d ? '#5a1a35' : '#f4c0d1' }}
            >
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${scalePercent}%`,
                  background: 'linear-gradient(90deg, #85b7eb 0%, #5dcaa5 30%, #ef9f27 65%, #e24b4a 100%)'
                }}
              />
            </div>

            <div
              className="flex justify-between text-[10px] mb-4"
              style={{ color: subColor }}
            >
              <span>Under</span>
              <span>Normal</span>
              <span>Over</span>
              <span>Obese</span>
            </div>

            {/* Gender Note */}
            <InfoCard title={gender === 'female' ? 'Note for Women' : 'Note for Men'}>
              <p className="text-xs" style={{ color: resultText }}>
                {getGenderNote(parseFloat(bmi))}
              </p>
            </InfoCard>

            {/* Ideal Weight */}
            <InfoCard title="Ideal Weight Range">
              <p
                className="text-sm font-bold"
                style={{ color: d ? '#f4c0d1' : '#7f1d3e' }}
              >
                {idealWeight.min} – {idealWeight.max} {unit === 'metric' ? 'kg' : 'lbs'}
              </p>

              {results.weightToLose && (
                <p className="text-xs mt-1" style={{ color: resultText }}>
                  Lose {results.weightToLose} {unit === 'metric' ? 'kg' : 'lbs'} to reach healthy range
                </p>
              )}

              {results.weightToGain && (
                <p className="text-xs mt-1" style={{ color: resultText }}>
                  Gain {results.weightToGain} {unit === 'metric' ? 'kg' : 'lbs'} to reach healthy range
                </p>
              )}
            </InfoCard>

            {/* BMR */}
            <InfoCard title="Basal Metabolic Rate (BMR)">
              <p
                className="text-sm font-bold"
                style={{ color: d ? '#f4c0d1' : '#7f1d3e' }}
              >
                {results.bmr} kcal/day
              </p>
              <p className="text-xs mt-1" style={{ color: resultText }}>
                Calories your body burns at complete rest
              </p>
            </InfoCard>

            {/* TDEE */}
            <InfoCard title="Daily Calorie Needs (TDEE)">
              <p
                className="text-sm font-bold"
                style={{ color: d ? '#f4c0d1' : '#7f1d3e' }}
              >
                {results.tdee} kcal/day
              </p>
              <p className="text-xs mt-1 mb-2" style={{ color: resultText }}>
                Based on {results.activityLabel} activity level
              </p>

              <div className="grid grid-cols-3 gap-1">
                {[
                  { label: 'Lose weight', val: results.tdee - 500 },
                  { label: 'Maintain', val: results.tdee },
                  { label: 'Gain weight', val: results.tdee + 500 },
                ].map(item => (
                  <div
                    key={item.label}
                    className="rounded-lg p-1.5 text-center"
                    style={{
                      background: d ? '#1e0a14' : '#fff0f5',
                      border: `1px solid ${cardBorder}`
                    }}
                  >
                    <p className="text-[9px]" style={{ color: subColor }}>
                      {item.label}
                    </p>
                    <p
                      className="text-xs font-bold"
                      style={{ color: d ? '#f4c0d1' : '#7f1d3e' }}
                    >
                      {item.val} kcal
                    </p>
                  </div>
                ))}
              </div>
            </InfoCard>

            {/* Body Fat */}
            <InfoCard title="Estimated Body Fat %">
              <p
                className="text-sm font-bold"
                style={{ color: d ? '#f4c0d1' : '#7f1d3e' }}
              >
                {results.bodyFat}%
              </p>
              <p className="text-xs mt-1" style={{ color: resultText }}>
                {gender === 'female'
                  ? 'Healthy range for women: 20–35%'
                  : 'Healthy range for men: 10–25%'}
              </p>
            </InfoCard>

            {/* Fitness Age */}
            {results.fitnessAge && (
              <InfoCard title="Fitness Age">
                <div className="flex items-center gap-3 mb-1">
                  <p
                    className="text-2xl font-bold"
                    style={{ color: results.fitnessAge.color }}
                  >
                    {results.fitnessAge.fitnessAge}
                  </p>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      background: d ? '#1e0a14' : '#fff0f5',
                      color: results.fitnessAge.color,
                      border: `1px solid ${results.fitnessAge.color}`
                    }}
                  >
                    {results.fitnessAge.status}
                  </span>
                </div>

                <p className="text-xs" style={{ color: resultText }}>
                  {results.fitnessAge.message}
                </p>
                <p className="text-xs mt-1" style={{ color: subColor }}>
                  Based on BMI, age and activity level
                </p>
              </InfoCard>
            )}

            {/* Health Tips */}
            <InfoCard title="Health Tips">
              {getHealthTips().map((tip, i) => (
                <div key={i} className="flex items-start gap-2 mb-1">
                  <span className="text-pink-400 text-xs mt-0.5">✿</span>
                  <p className="text-xs" style={{ color: resultText }}>
                    {tip}
                  </p>
                </div>
              ))}
            </InfoCard>

            {/* Print PDF */}
            <button
              onClick={() => window.print()}
              className="w-full py-2 rounded-full text-white text-sm font-semibold mb-3 transition-all duration-200 hover:opacity-90 active:scale-95"
              style={{ background: btnGradient }}
            >
              Download Report as PDF
            </button>

            {/* Reset */}
            <button
              onClick={resetForm}
              className="w-full py-2 rounded-full text-sm font-medium transition-all duration-200"
              style={{
                background: sectionBg,
                border: `1.5px solid ${cardBorder}`,
                color: labelColor
              }}
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BMICalculator;

