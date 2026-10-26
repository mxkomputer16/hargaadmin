<?php
// Kompatibel untuk PHP 5.6+
error_reporting(E_ALL);
ini_set('display_errors', 1);

session_start();

// Jika pengguna sudah login sebelumnya, langsung lempar ke dataadmin/index.php
if (isset($_SESSION['is_logged_in']) && $_SESSION['is_logged_in'] === true) {
    header("Location: dataadmin/index.php");
    exit;
}

$error_message = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Pengambilan data form aman untuk PHP 5.6
    $username = isset($_POST['username']) ? trim($_POST['username']) : '';
    $password = isset($_POST['password']) ? trim($_POST['password']) : '';

    $valid_username = getenv('ADMIN_USERNAME');
    $valid_password = getenv('ADMIN_PASSWORD');

    if ($valid_username !== false && $valid_password !== false &&
        hash_equals($valid_username, $username) && hash_equals($valid_password, $password)) {
        session_regenerate_id(true);
        $_SESSION['is_logged_in'] = true;
        $_SESSION['username'] = $username;

        // Redirect ke dashboard admin
        header("Location: dataadmin/index.php");
        exit;
    } else {
        $error_message = ($valid_username === false || $valid_password === false)
            ? 'Login belum dikonfigurasi di server.'
            : 'Username atau password salah!';
    }
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - MX Data Service</title>
    <!-- Font & Icons -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

    <style>
        :root {
            --bg-color: #0f172a;
            --card-bg: rgba(30, 41, 59, 0.7);
            --primary: #3b82f6;
            --primary-hover: #2563eb;
            --accent: #60a5fa;
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
            --border-color: rgba(255, 255, 255, 0.1);
            --error-bg: rgba(239, 68, 68, 0.15);
            --error-border: rgba(239, 68, 68, 0.4);
            --error-text: #fca5a5;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Plus Jakarta Sans', sans-serif;
            -webkit-tap-highlight-color: transparent;
        }

        [hidden] {
            display: none !important;
        }

        body {
            background-color: var(--bg-color);
            color: var(--text-main);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            overflow-x: hidden;
            position: relative;
            padding: 20px;
        }

        /* Ambient Glow Background Animation */
        .bg-glow {
            position: absolute;
            width: 350px;
            height: 350px;
            border-radius: 50%;
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
            filter: blur(90px);
            opacity: 0.35;
            z-index: 0;
            animation: floatGlow 10s infinite alternate ease-in-out;
        }

        .bg-glow-1 {
            top: 10%;
            left: 15%;
        }

        .bg-glow-2 {
            bottom: 10%;
            right: 15%;
            animation-delay: -5s;
            background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
        }

        @keyframes floatGlow {
            0% { transform: translate(0, 0) scale(1); }
            100% { transform: translate(30px, 40px) scale(1.1); }
        }

        /* Login Card */
        .login-card {
            position: relative;
            z-index: 1;
            width: 100%;
            max-width: 420px;
            background: var(--card-bg);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid var(--border-color);
            border-radius: 24px;
            padding: 40px 32px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
            animation: cardAppear 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes cardAppear {
            from {
                opacity: 0;
                transform: translateY(20px) scale(0.97);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        /* Header */
        .card-header {
            text-align: center;
            margin-bottom: 32px;
        }

        .logo-icon {
            width: 56px;
            height: 56px;
            background: linear-gradient(135deg, #2563eb, #60a5fa);
            border-radius: 16px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            color: #ffffff;
            margin-bottom: 16px;
            box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
            transition: transform 0.3s ease;
        }

        .login-card:hover .logo-icon {
            transform: scale(1.05) rotate(3deg);
        }

        .card-header h2 {
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -0.5px;
            margin-bottom: 8px;
        }

        .card-header p {
            font-size: 14px;
            color: var(--text-muted);
        }

        /* Error Box */
        .error-alert {
            background: var(--error-bg);
            border: 1px solid var(--error-border);
            color: var(--error-text);
            padding: 12px 16px;
            border-radius: 12px;
            font-size: 14px;
            margin-bottom: 24px;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: shake 0.4s ease-in-out;
        }

        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-5px); }
            40%, 80% { transform: translateX(5px); }
        }

        /* Input Group */
        .input-group {
            margin-bottom: 20px;
            position: relative;
        }

        .input-group label {
            display: block;
            font-size: 13px;
            font-weight: 600;
            color: var(--text-muted);
            margin-bottom: 8px;
        }

        .input-wrapper {
            position: relative;
            display: flex;
            align-items: center;
        }

        .input-icon {
            position: absolute;
            left: 16px;
            color: var(--text-muted);
            font-size: 16px;
            transition: color 0.3s ease;
        }

        .input-field {
            width: 100%;
            padding: 14px 16px 14px 48px;
            background: rgba(15, 23, 42, 0.6);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            color: var(--text-main);
            font-size: 15px;
            outline: none;
            transition: all 0.3s ease;
        }

        .input-field::placeholder {
            color: #64748b;
        }

        .input-field:focus {
            border-color: var(--primary);
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
            background: rgba(15, 23, 42, 0.8);
        }

        .input-field:focus ~ .input-icon {
            color: var(--accent);
        }

        /* Toggle Password Button */
        .toggle-password {
            position: absolute;
            right: 16px;
            background: none;
            border: none;
            color: var(--text-muted);
            cursor: pointer;
            font-size: 16px;
            padding: 4px;
            transition: color 0.3s ease;
        }

        .toggle-password:hover {
            color: var(--text-main);
        }

        /* Submit Button */
        .btn-submit {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, var(--primary), var(--primary-hover));
            border: none;
            border-radius: 12px;
            color: #ffffff;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
            margin-top: 8px;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 8px;
        }

        .btn-submit:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
        }

        .btn-submit:active {
            transform: translateY(0);
        }

        /* Responsive Mobile Styling */
        @media (max-width: 480px) {
            body {
                padding: 16px;
            }

            .login-card {
                padding: 32px 20px;
                border-radius: 20px;
            }

            .card-header h2 {
                font-size: 22px;
            }

            .bg-glow {
                width: 250px;
                height: 250px;
            }
        }
    </style>
</head>
<body>

    <!-- Ambient Glow Effects -->
    <div class="bg-glow bg-glow-1"></div>
    <div class="bg-glow bg-glow-2"></div>

    <!-- Main Container -->
    <div class="login-card">
        <div class="card-header">
            <div class="logo-icon">
                <i class="fa-solid fa-shield-halved"></i>
            </div>
            <h2>Selamat Datang</h2>
            <p>Silakan masuk ke panel admin Anda</p>
        </div>

        <div class="error-alert" id="loginError" role="alert" <?php if (empty($error_message)): ?>hidden<?php endif; ?>>
                <i class="fa-solid fa-triangle-exclamation"></i>
                <span><?php echo htmlspecialchars($error_message); ?></span>
        </div>

        <form action="index.php" method="POST" id="loginForm">
            <div class="input-group">
                <label for="username">Username</label>
                <div class="input-wrapper">
                    <input type="text" id="username" name="username" class="input-field" placeholder="Masukkan username" required autocomplete="off">
                    <i class="fa-solid fa-user input-icon"></i>
                </div>
            </div>

            <div class="input-group">
                <label for="password">Password</label>
                <div class="input-wrapper">
                    <input type="password" id="password" name="password" class="input-field" placeholder="••••••••" required>
                    <i class="fa-solid fa-lock input-icon"></i>
                    <button type="button" class="toggle-password" id="togglePasswordBtn" aria-label="Lihat Password">
                        <i class="fa-solid fa-eye" id="toggleIcon"></i>
                    </button>
                </div>
            </div>

            <button type="submit" class="btn-submit">
                <span>Masuk Sekarang</span>
                <i class="fa-solid fa-arrow-right"></i>
            </button>
        </form>
    </div>

    <script>
        // Toggle Password Visibility
        const togglePasswordBtn = document.getElementById('togglePasswordBtn');
        const passwordInput = document.getElementById('password');
        const toggleIcon = document.getElementById('toggleIcon');
        const loginForm = document.getElementById('loginForm');
        const loginError = document.getElementById('loginError');

        loginForm.addEventListener('submit', async function (event) {
            if (window.location.pathname.toLowerCase().endsWith('.php')) return;
            event.preventDefault();
            loginError.hidden = false;
            loginError.querySelector('span').textContent = 'Memeriksa login...';

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'same-origin',
                    body: JSON.stringify({
                        username: document.getElementById('username').value,
                        password: passwordInput.value
                    })
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error || 'Login gagal.');
                window.location.assign('/dataadmin');
            } catch (error) {
                loginError.querySelector('span').textContent = error.message;
            }
        });

        if (!window.location.pathname.toLowerCase().endsWith('.php')) {
            fetch('/api/auth/session', { credentials: 'same-origin' })
                .then(response => {
                    if (response.ok) window.location.replace('/dataadmin');
                })
                .catch(error => console.error('Gagal memeriksa sesi login:', error));
        }

        togglePasswordBtn.addEventListener('click', function () {
            const isPassword = passwordInput.getAttribute('type') === 'password';
            passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
            
            // Toggle Icon
            toggleIcon.classList.toggle('fa-eye');
            toggleIcon.classList.toggle('fa-eye-slash');
        });
    </script>
</body>
</html>