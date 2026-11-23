<?php
require_once __DIR__ . '/includes/bootstrap.php';
require_once __DIR__ . '/config/google.php';
if (!empty($_SESSION['user'])) { header('Location: ' . ($_SESSION['user']['role']==='teacher'?'teacher/dashboard.php':'student/dashboard.php')); exit; }
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta name="csrf-token" content="<?= e($_SESSION['csrf_token']) ?>">
  <meta name="google-client-id" content="<?= e(GOOGLE_CLIENT_ID) ?>">
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>StudyBuddy — Sign Up</title>
  <link rel="stylesheet" href="css/style.css" />
  <link rel="stylesheet" href="css/components.css" />
  <link rel="stylesheet" href="css/pages.css" />
  <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body>
  <div class="auth-page">
    <div class="auth-left">
      <div class="auth-brand">
        <img src="assets/logo.png" alt="StudyBuddy" />
        <div class="brand-text">StudyBuddy</div>
      </div>
      <div class="auth-tagline">Learn. Track. Achieve.</div>
      <div class="auth-hero">
        <h1>Start your journey today.</h1>
        <p>Create a free account to organize subjects, track assignments, and sync classes from Google Classroom.</p>
      </div>
      <div class="auth-illustration">
        <img src="assets/wallpaper.png" alt="StudyBuddy" style="border-radius:16px;max-height:320px;object-fit:cover;" />
      </div>
    </div>

    <div class="auth-right">
      <div class="auth-signup-link">
        Already have an account? <a href="index.php">Log in</a>
      </div>

      <div class="auth-form-wrap">
        <div class="auth-form-logo">
          <img src="assets/logo.png" alt="" />
          <h2>StudyBuddy</h2>
          <div class="welcome">Create account</div>
          <div class="sub">Join thousands of students and teachers.</div>
        </div>

        <div class="auth-error" id="signupError"></div>

        <form id="signupForm" novalidate>
          <div id="signupCredentialsStep">
            <div class="form-group">
              <label for="fullName">Full Name</label>
              <div class="input-icon-wrap">
                <i data-lucide="user" class="input-icon"></i>
                <input class="form-control" type="text" id="fullName" placeholder="Full name" autocomplete="name" required />
              </div>
            </div>
            <div class="form-group">
              <label for="email">Email</label>
              <div class="input-icon-wrap">
                <i data-lucide="mail" class="input-icon"></i>
                <input class="form-control" type="email" id="email" placeholder="you@email.com" autocomplete="email" required />
              </div>
            </div>
            <div class="form-group">
              <label for="password">Password</label>
              <div class="input-icon-wrap has-password-toggle">
                <i data-lucide="lock" class="input-icon"></i>
                <input class="form-control" type="password" id="password" placeholder="At least 8 characters" autocomplete="new-password" minlength="8" required />
                <button type="button" class="input-action" id="togglePassword" aria-label="Show password" aria-controls="password" aria-pressed="false">
                  <i data-lucide="eye"></i>
                </button>
              </div>
            </div>
            <div class="form-group">
              <label for="confirmPassword">Confirm Password</label>
              <div class="input-icon-wrap has-password-toggle">
                <i data-lucide="lock" class="input-icon"></i>
                <input class="form-control" type="password" id="confirmPassword" placeholder="Re-enter your password" autocomplete="new-password" required />
                <button type="button" class="input-action" id="toggleConfirmPassword" aria-label="Show confirm password" aria-controls="confirmPassword" aria-pressed="false">
                  <i data-lucide="eye"></i>
                </button>
              </div>
            </div>
            <div class="form-group">
              <label for="role">I am a...</label>
              <select class="form-control" id="role">
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
            </div>
            <button type="button" class="btn btn-primary btn-lg btn-block" id="signupContinueBtn">
              Continue <i data-lucide="arrow-right"></i>
            </button>
          </div>

          <div id="signupDetailsStep" hidden>
            <div id="signupStudentFields">
              <div class="form-group">
                <label for="signupStudentId">Student ID</label>
                <input class="form-control" type="text" id="signupStudentId" name="studentId" maxlength="255" autocomplete="off" required />
              </div>
              <div class="form-group">
                <label for="signupPhone">Phone</label>
                <input class="form-control" type="tel" id="signupPhone" name="phone" maxlength="255" autocomplete="tel" required />
              </div>
              <div class="form-group">
                <label for="signupSchool">School</label>
                <input class="form-control" type="text" id="signupSchool" name="school" maxlength="255" autocomplete="organization" required />
              </div>
              <div class="form-group">
                <label for="signupCourse">Course</label>
                <input class="form-control" type="text" id="signupCourse" name="course" maxlength="255" autocomplete="off" required />
              </div>
              <div class="form-group">
                <label for="signupYearLevel">School Level</label>
                <input class="form-control" type="text" id="signupYearLevel" name="yearLevel" maxlength="255" autocomplete="off" required />
              </div>
            </div>
            <div id="signupTeacherFields" hidden>
              <div class="form-group">
                <label for="signupEmployeeId">Employee ID</label>
                <input class="form-control" type="text" id="signupEmployeeId" name="employeeId" maxlength="255" autocomplete="off" required />
              </div>
              <div class="form-group">
                <label for="signupTeacherPhone">Phone</label>
                <input class="form-control" type="tel" id="signupTeacherPhone" name="phone" maxlength="255" autocomplete="tel" required />
              </div>
              <div class="form-group">
                <label for="signupTeacherSchool">School</label>
                <input class="form-control" type="text" id="signupTeacherSchool" name="school" maxlength="255" autocomplete="organization" required />
              </div>
              <div class="form-group">
                <label for="signupDepartment">Department</label>
                <input class="form-control" type="text" id="signupDepartment" name="department" maxlength="255" autocomplete="organization-title" required />
              </div>
            </div>
            <div class="auth-signup-actions">
              <button type="button" class="btn btn-ghost btn-lg btn-block" id="signupBackBtn">
                <i data-lucide="arrow-left"></i> Back
              </button>
              <button type="submit" class="btn btn-primary btn-lg btn-block">
                Create Account <i data-lucide="arrow-right"></i>
              </button>
            </div>
          </div>
        </form>

        <form class="auth-form" id="totpForm" hidden>
          <p class="sub" style="margin-bottom:14px">Enter the 6-digit code from Google Authenticator, or one of your backup codes.</p>
          <div class="form-group">
            <input class="form-control" type="text" id="totpCode" inputmode="numeric" autocomplete="one-time-code" placeholder="Authenticator or backup code" required />
          </div>
          <button type="submit" class="btn btn-primary btn-lg btn-block">Verify code</button>
          <button type="button" class="btn btn-ghost btn-block" id="totpBack" style="margin-top:8px">Back</button>
        </form>

        <form class="auth-form" id="googleRoleForm" novalidate hidden>
          <p class="sub" id="googleRoleText" style="margin-bottom:14px">Choose how you will use StudyBuddy.</p>
          <div id="googleRoleStep">
            <div class="form-group">
              <label for="googleRole">I am a...</label>
              <select class="form-control" id="googleRole">
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
            </div>
            <button type="button" class="btn btn-primary btn-lg btn-block" id="googleContinueBtn">Continue</button>
          </div>
          <div id="googleDetailsStep" hidden>
            <div id="googleStudentFields">
              <div class="form-group">
                <label for="googleStudentId">Student ID</label>
                <input class="form-control" type="text" id="googleStudentId" name="studentId" maxlength="255" autocomplete="off" required />
              </div>
              <div class="form-group">
                <label for="googlePhone">Phone</label>
                <input class="form-control" type="tel" id="googlePhone" name="phone" maxlength="255" autocomplete="tel" required />
              </div>
              <div class="form-group">
                <label for="googleSchool">School</label>
                <input class="form-control" type="text" id="googleSchool" name="school" maxlength="255" autocomplete="organization" required />
              </div>
              <div class="form-group">
                <label for="googleCourse">Course</label>
                <input class="form-control" type="text" id="googleCourse" name="course" maxlength="255" autocomplete="off" required />
              </div>
              <div class="form-group">
                <label for="googleYearLevel">School Level</label>
                <input class="form-control" type="text" id="googleYearLevel" name="yearLevel" maxlength="255" autocomplete="off" required />
              </div>
            </div>
            <div id="googleTeacherFields" hidden>
              <div class="form-group">
                <label for="googleEmployeeId">Employee ID</label>
                <input class="form-control" type="text" id="googleEmployeeId" name="employeeId" maxlength="255" autocomplete="off" required />
              </div>
              <div class="form-group">
                <label for="googleTeacherPhone">Phone</label>
                <input class="form-control" type="tel" id="googleTeacherPhone" name="phone" maxlength="255" autocomplete="tel" required />
              </div>
              <div class="form-group">
                <label for="googleTeacherSchool">School</label>
                <input class="form-control" type="text" id="googleTeacherSchool" name="school" maxlength="255" autocomplete="organization" required />
              </div>
              <div class="form-group">
                <label for="googleDepartment">Department</label>
                <input class="form-control" type="text" id="googleDepartment" name="department" maxlength="255" autocomplete="organization-title" required />
              </div>
            </div>
            <div class="auth-signup-actions">
              <button type="button" class="btn btn-ghost btn-lg btn-block" id="googleBackBtn">Back</button>
              <button type="submit" class="btn btn-primary btn-lg btn-block">Create Account</button>
            </div>
          </div>
        </form>

        <div class="auth-divider">or</div>
        <a class="btn-google" id="googleLogin" href="api/google.php?action=start&amp;purpose=login">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.03 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </a>

        <div class="auth-footer">
          By signing up, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
        </div>
      </div>
    </div>
  </div>

  <script src="js/data.js"></script>
  <script src="js/auth.js"></script>
  <script>lucide.createIcons();</script>
</body>
</html>
