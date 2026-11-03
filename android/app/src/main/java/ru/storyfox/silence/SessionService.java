package ru.storyfox.silence;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;

/**
 * Служба переднего плана на время практики: держит процесс и процессор живыми,
 * чтобы таймер, голос и музыка не останавливались при выключенном экране.
 */
public class SessionService extends Service {
    static final String EXTRA_TITLE = "title";
    private static final String CHANNEL = "session";
    private static final int ID = 1;
    private PowerManager.WakeLock wakeLock;

    static void start(Context ctx, String title) {
        Intent i = new Intent(ctx, SessionService.class).putExtra(EXTRA_TITLE, title);
        if (Build.VERSION.SDK_INT >= 26) ctx.startForegroundService(i);
        else ctx.startService(i);
    }

    static void stop(Context ctx) {
        ctx.stopService(new Intent(ctx, SessionService.class));
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String title = intent != null ? intent.getStringExtra(EXTRA_TITLE) : null;
        Notification n = buildNotification(title == null || title.isEmpty() ? "Практика" : title);
        if (Build.VERSION.SDK_INT >= 29) {
            startForeground(ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        } else {
            startForeground(ID, n);
        }
        if (wakeLock == null) {
            PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "StoryFoxSilence:session");
            // страховка: самая длинная практика — 60 минут
            wakeLock.acquire(2 * 60 * 60 * 1000L);
        }
        return START_NOT_STICKY;
    }

    private Notification buildNotification(String title) {
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        Notification.Builder b;
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel ch = new NotificationChannel(CHANNEL, "Практика", NotificationManager.IMPORTANCE_LOW);
            ch.setDescription("Показывается, пока идёт медитация");
            ch.setShowBadge(false);
            nm.createNotificationChannel(ch);
            b = new Notification.Builder(this, CHANNEL);
        } else {
            b = new Notification.Builder(this);
        }
        Intent open = new Intent(this, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pi = PendingIntent.getActivity(this, 0, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        return b.setSmallIcon(R.drawable.ic_notification)
                .setContentTitle(title)
                .setContentText("Идёт практика — StoryFox Silence")
                .setContentIntent(pi)
                .setOngoing(true)
                .setColor(0xFFA8C3A0)
                .build();
    }

    @Override
    public void onDestroy() {
        if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
        wakeLock = null;
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
