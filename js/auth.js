/** StudyBuddy authentication backed by PHP sessions and MySQL. */
const SB_AUTH_BASE = (window.location.pathname.includes('/student/') || window.location.pathname.includes('/teacher/')) ? '../api/' : 'api/';
function csrfToken(){ return document.querySelector('meta[name="csrf-token"]')?.content || ''; }
function apiAuth(action, data={}) {
  const body=new URLSearchParams({action,...data});
  return fetch(`${SB_AUTH_BASE}auth.php?action=${encodeURIComponent(action)}`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded','X-CSRF-Token':csrfToken()},body});
}
function getSession(){
  const xhr=new XMLHttpRequest(); xhr.open('GET',`${SB_AUTH_BASE}auth.php?action=session`,false); xhr.send();
  try { const r=JSON.parse(xhr.responseText); return r.user || null; } catch { return null; }
}
function requireAuth(expectedRole){ const session=getSession(); if(!session){location.href='../index.php';return null;} if(expectedRole&&session.role!==expectedRole){location.href=session.role==='teacher'?'../teacher/dashboard.php':'../student/dashboard.php';return null;} return session; }
function logout(){ apiAuth('logout').finally(()=>{location.href=location.pathname.includes('/student/')||location.pathname.includes('/teacher/')?'../index.php':'index.php';}); }
function showAuthError(el,message){ if(el){el.textContent=message;el.classList.add('show');} }
function initLoginPage(){
 const form=document.getElementById('loginForm'), errorEl=document.getElementById('loginError'), pw=document.getElementById('password'), toggle=document.getElementById('togglePassword');
 toggle?.addEventListener('click',()=>{pw.type=pw.type==='password'?'text':'password';});
 form?.addEventListener('submit',async e=>{e.preventDefault(); const email=document.getElementById('email').value.trim(), password=pw.value; if(!email||!password){showAuthError(errorEl,'Please enter both email and password.');return;} try{const r=await apiAuth('login',{email,password});const d=await r.json();if(!r.ok||!d.ok){showAuthError(errorEl,d.message||'Unable to log in.');return;}location.href=d.redirect;}catch{showAuthError(errorEl,'Unable to connect to the server.');}});
 document.getElementById('demoStudent')?.addEventListener('click',()=>showAuthError(errorEl,'Demo accounts are disabled. Please register a student account.'));
 document.getElementById('demoTeacher')?.addEventListener('click',()=>showAuthError(errorEl,'Demo accounts are disabled. Please register a teacher account.'));
 document.getElementById('googleLogin')?.addEventListener('click',()=>showAuthError(errorEl,'Google sign-in will be added in a later development phase.'));
}
function initSignupPage(){
 const form=document.getElementById('signupForm'), errorEl=document.getElementById('signupError');
 form?.addEventListener('submit',async e=>{e.preventDefault();const name=document.getElementById('fullName').value.trim(),email=document.getElementById('email').value.trim(),password=document.getElementById('password').value,role=document.getElementById('role')?.value||'student';if(!name||!email||!password){showAuthError(errorEl,'Please fill in all required fields.');return;}if(password.length<8){showAuthError(errorEl,'Password must be at least 8 characters.');return;}try{const r=await apiAuth('register',{name,email,password,role});const d=await r.json();if(!r.ok||!d.ok){showAuthError(errorEl,d.message||'Unable to create account.');return;}location.href=d.redirect;}catch{showAuthError(errorEl,'Unable to connect to the server.');}});
}
document.addEventListener('DOMContentLoaded',()=>{if(document.getElementById('loginForm'))initLoginPage();if(document.getElementById('signupForm'))initSignupPage();});
