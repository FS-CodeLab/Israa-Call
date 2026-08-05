let deferredPrompt;
let currentAppVersion = "1.0.5";

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallButton();
});

function showInstallButton() {
    // التحقق مما إذا كان التطبيق مثبتاً بالفعل
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
        return;
    }
    const installContainer = document.getElementById('installButtonContainer');
    if (installContainer) {
        installContainer.innerHTML = `
            <button onclick="installApp()" class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5 animate-bounce">
                📲 تثبيت التطبيق
            </button>
        `;
    }
}

async function installApp() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            document.getElementById('installButtonContainer').innerHTML = '';
        }
        deferredPrompt = null;
    }
}

// فحص التحديثات عند البدء
async function checkForUpdates(manual = false) {
    try {
        const response = await fetch('./version.json?t=' + new Date().getTime());
        const data = await response.json();
        if (data.version && data.version !== currentAppVersion) {
            showUpdateNotification(data.message);
        } else if (manual) {
            if (typeof showToast === 'function') showToast('أنت تستخدم أحدث إصدار بالفعل ✅');
        }
    } catch (err) {
        if (manual && typeof showToast === 'function') showToast('تعذر الاتصال للبحث عن تحديثات.');
    }
}

function showUpdateNotification(msg) {
    let updateBanner = document.getElementById('updateBanner');
    if (!updateBanner) {
        updateBanner = document.createElement('div');
        updateBanner.id = 'updateBanner';
        updateBanner.className = 'fixed inset-x-0 top-0 bg-indigo-600 text-white text-center py-3 px-4 z-50 flex items-center justify-between shadow-lg text-xs font-bold';
        updateBanner.innerHTML = `
            <span>🚀 يوجد تحديث جديد للتطبيق: ${msg}</span>
            <button onclick="applyAppUpdate()" class="bg-white text-indigo-600 px-3 py-1.5 rounded-lg shadow font-extrabold hover:bg-slate-100 transition">تحديث الآن</button>
        `;
        document.body.prepend(updateBanner);
    }
}

async function applyAppUpdate() {
    if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let registration of registrations) {
            await registration.unregister();
        }
    }
    caches.keys().then((names) => {
        names.forEach((name) => {
            caches.delete(name);
        });
    });
    window.location.reload(true);
}

// تسجيل Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then((reg) => {
                console.log('ServiceWorker registered successfully.');
            })
            .catch((err) => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

setInterval(() => { checkForUpdates(false); }, 1000 * 60 * 30); // فحص كل 30 دقيقة