package com.onlineexamsystem.app

import android.content.ContentValues
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.util.Base64
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File
import java.io.FileOutputStream
import java.io.OutputStream

class FileSaverModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "FileSaver"
    }

    @ReactMethod
    fun saveBase64ToDownloads(base64Str: String, fileName: String, promise: Promise) {
        try {
            val bytes = Base64.decode(base64Str, Base64.DEFAULT)
            val context = reactApplicationContext

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                // Use MediaStore for Android 10+ (Scoped Storage compatible)
                val resolver = context.contentResolver
                val contentValues = ContentValues().apply {
                    put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
                    put(MediaStore.MediaColumns.MIME_TYPE, "application/pdf")
                    put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
                }

                val uri: Uri? = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues)
                if (uri != null) {
                    val outputStream: OutputStream? = resolver.openOutputStream(uri)
                    if (outputStream != null) {
                        outputStream.write(bytes)
                        outputStream.close()
                        promise.resolve("Downloads/$fileName")
                        return
                    }
                }
                promise.reject("WRITE_ERROR", "Could not open output stream via MediaStore")
            } else {
                // Standard File API for Android 9 and below
                val downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
                if (!downloadsDir.exists()) {
                    downloadsDir.mkdirs()
                }
                val file = File(downloadsDir, fileName)
                val fos = FileOutputStream(file)
                fos.write(bytes)
                fos.close()
                promise.resolve("Downloads/$fileName")
            }
        } catch (e: Exception) {
            promise.reject("SAVE_FAILED", e.message, e)
        }
    }
}
