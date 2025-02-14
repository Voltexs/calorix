const USER_PROFILE_KEY = 'userProfileData';

const calculateBMR = (weight, height, age, gender) => {
  // Mifflin-St Jeor Equation
  if (gender === 'male') {
    return (10 * weight) + (6.25 * height) - (5 * age) + 5;
  } else {
    return (10 * weight) + (6.25 * height) - (5 * age) - 161;
  }
};

const calculateTDEE = (bmr, activityLevel) => {
  const activityMultipliers = {
    sedentary: 1.2,
    lightlyActive: 1.375,
    moderatelyActive: 1.55,
    veryActive: 1.725,
    extraActive: 1.9
  };
  return bmr * activityMultipliers[activityLevel];
};

export const saveUserProfile = (userData) => {
  const bmr = calculateBMR(userData.weight, userData.height, userData.age, userData.gender);
  const tdee = calculateTDEE(bmr, userData.activityLevel);
  
  const profileData = {
    ...userData,
    bmr,
    tdee,
    dailyCalories: tdee,
    macroSplit: {
      protein: Math.round(userData.weight * 2.2), // 1g per lb of body weight
      fats: Math.round((tdee * 0.25) / 9), // 25% of calories from fat
      carbs: Math.round((tdee - (userData.weight * 2.2 * 4) - ((tdee * 0.25))) / 4) // Remaining calories from carbs
    }
  };
  
  localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profileData));
  return profileData;
};

export const getUserProfile = () => {
  const profile = localStorage.getItem(USER_PROFILE_KEY);
  return profile ? JSON.parse(profile) : null;
}; 