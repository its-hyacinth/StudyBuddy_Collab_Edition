<?php
if (!defined('GOOGLE_CLIENT_ID')) require_once __DIR__ . '/../config/google.php';
?>
<div id="authenticatorPanel" data-google-client-id="<?= e(GOOGLE_CLIENT_ID) ?>" style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border)">
  <div class="settings-row" style="cursor:default">
    <div>
      <div class="row-label">Google Authenticator</div>
      <div class="row-value" id="authenticatorStatus">A 6-digit code will be required each time you sign in.</div>
    </div>
  </div>
  <div id="authenticatorIdle" style="padding:0 0 16px;display:flex;gap:8px;flex-wrap:wrap">
    <button type="button" class="btn btn-primary btn-sm" id="enableAuthenticator">Set up Google Authenticator</button>
  </div>
  <div id="authenticatorSetup" hidden style="padding:0 0 16px">
    <p class="row-value">In the Google Authenticator app, choose Add an account, scan the QR code, or enter this setup key.</p>
    <div id="authenticatorQr" style="margin:12px 0"></div>
    <code class="authenticator-secret" id="authenticatorSecret"></code>
    <div class="form-group" style="margin-top:12px;max-width:280px">
      <label for="authenticatorCode">6-digit code</label>
      <input class="form-control" id="authenticatorCode" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="123456" />
    </div>
    <button type="button" class="btn btn-primary btn-sm" id="confirmAuthenticator">Confirm and enable</button>
    <button type="button" class="btn btn-ghost btn-sm" id="cancelAuthenticator">Cancel</button>
  </div>
  <div id="authenticatorBackup" hidden style="padding:0 0 16px">
    <p class="row-label">Save these backup codes</p>
    <p class="row-value">Each code works once if you lose your phone. They will not be shown again.</p>
    <div class="backup-codes" id="authenticatorBackupList"></div>
  </div>
  <div id="authenticatorDisable" hidden style="padding:0 0 16px">
    <div class="form-group" style="max-width:280px">
      <label for="disableAuthenticatorCode">Current code or backup code</label>
      <input class="form-control" id="disableAuthenticatorCode" inputmode="text" autocomplete="one-time-code" placeholder="Authenticator or backup code" />
    </div>
    <button type="button" class="btn btn-outline btn-sm" id="disableAuthenticator">Turn off Google Authenticator</button>
  </div>
  <div class="settings-row" style="cursor:default">
    <div>
      <div class="row-label">Google sign-in</div>
      <div class="row-value" id="googleLinkStatus">Connect the Google account that uses this same email address.</div>
    </div>
  </div>
  <div id="googleLinkActions" style="padding:0 0 8px;display:flex;gap:8px;flex-wrap:wrap;align-items:center">
    <div id="googleLinkButtonHost"></div>
    <button type="button" class="btn btn-outline btn-sm" id="unlinkGoogle" hidden>Disconnect Google</button>
  </div>
</div>
