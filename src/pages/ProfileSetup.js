import { getUserProfile, saveUserProfile } from '../utils/userProfile.js';

export class ProfileSetup {
  constructor() {
    this.initializeForm();
  }

  initializeForm() {
    const existingProfile = getUserProfile();
    if (existingProfile) {
      // Redirect to dashboard if profile exists
      window.location.href = '/dashboard.html';
      return;
    }

    const form = document.createElement('form');
    form.innerHTML = `
      <div class="profile-setup">
        <h1>Welcome to MacroTracker</h1>
        <div class="form-group">
          <label for="name">Name:</label>
          <input type="text" id="name" required>
        </div>
        <div class="form-group">
          <label for="age">Age:</label>
          <input type="number" id="age" required min="15" max="100">
        </div>
        <div class="form-group">
          <label for="gender">Gender:</label>
          <select id="gender" required>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
        <div class="form-group">
          <label for="weight">Weight (kg):</label>
          <input type="number" id="weight" required step="0.1">
        </div>
        <div class="form-group">
          <label for="height">Height (cm):</label>
          <input type="number" id="height" required>
        </div>
        <div class="form-group">
          <label for="activityLevel">Activity Level:</label>
          <select id="activityLevel" required>
            <option value="sedentary">Sedentary (office job)</option>
            <option value="lightlyActive">Lightly Active (1-2 days/week)</option>
            <option value="moderatelyActive">Moderately Active (3-5 days/week)</option>
            <option value="veryActive">Very Active (6-7 days/week)</option>
            <option value="extraActive">Extra Active (athlete)</option>
          </select>
        </div>
        <button type="submit">Save Profile</button>
      </div>
    `;

    form.addEventListener('submit', this.handleSubmit.bind(this));
    document.body.appendChild(form);
  }

  handleSubmit(event) {
    event.preventDefault();
    
    const formData = {
      name: document.getElementById('name').value,
      age: parseInt(document.getElementById('age').value),
      gender: document.getElementById('gender').value,
      weight: parseFloat(document.getElementById('weight').value),
      height: parseInt(document.getElementById('height').value),
      activityLevel: document.getElementById('activityLevel').value
    };

    const profile = saveUserProfile(formData);
    console.log('Profile saved:', profile);
    window.location.href = '/dashboard.html';
  }
} 