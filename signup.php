<?php require_once __DIR__ . '/includes/bootstrap.php'; if (!empty($_SESSION['user'])) { header('Location: ' . ($_SESSION['user']['role']==='teacher'?'teacher/dashboard.php':'student/dashboard.php')); exit; } ?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta name="csrf-token" content="<?= e($_SESSION['csrf_token']) ?>">
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
        <div class="brand-text">StudyBuddyyy</div>
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
          <div class="form-group">
            <label for="fullName">Full Name</label>
            <div class="input-icon-wrap">
              <i data-lucide="user" class="input-icon"></i>
              <input class="form-control" type="text" id="fullName" placeholder="Juan Dela Cruz" required />
            </div>
          </div>
          <div class="form-group">
            <label for="email">Email</label>
            <div class="input-icon-wrap">
              <i data-lucide="mail" class="input-icon"></i>
              <input class="form-control" type="email" id="email" placeholder="you@email.com" required />
            </div>
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <div class="input-icon-wrap">
              <i data-lucide="lock" class="input-icon"></i>
              <input class="form-control" type="password" id="password" placeholder="At least 6 characters" required />
            </div>
          </div>
          <div class="form-group">
            <label for="role">I am a...</label>
            <select class="form-control" id="role">
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary btn-lg btn-block">
            Create Account <i data-lucide="arrow-right"></i>
          </button>
        </form>

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
