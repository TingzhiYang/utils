package com.cityk.DangerousWastePDA.model;

import android.app.ProgressDialog;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.AsyncTask;
import android.view.View;
import android.widget.ImageView;

import com.cityk.DangerousWastePDA.util.LogUtil;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;

import okhttp3.Call;

public  class ImageUtils {

    // 将Bitmap等比例缩小到目标大小（以KB为单位）
    public static byte[] compressBitmap(Bitmap originalBitmap, int maxSizeKB) {
        ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
        int quality = 100;

        originalBitmap.compress(Bitmap.CompressFormat.JPEG, quality, byteArrayOutputStream);
        byte[] originBytes = byteArrayOutputStream.toByteArray();
        LogUtil.e(originBytes.length+"————————————————————originBytes");
        if (originBytes.length / 1024 / 1024 > 1){
            quality = 40;
        }else{
            quality = 90;
        }
        do {
            byteArrayOutputStream.reset();
            originalBitmap.compress(Bitmap.CompressFormat.JPEG, quality, byteArrayOutputStream);
            quality -= 10;
        } while (byteArrayOutputStream.toByteArray().length > (maxSizeKB * 1024) && quality > 0);
        LogUtil.e(quality+"————————————————");
        return byteArrayOutputStream.toByteArray();
    }

    // 从文件中加载Bitmap
    public static Bitmap loadBitmapFromFile(String imagePath) {
        BitmapFactory.Options options = new BitmapFactory.Options();
        options.inPreferredConfig = Bitmap.Config.ARGB_8888;
        return BitmapFactory.decodeFile(imagePath, options);
    }
    public static Bitmap DownloadImageFromPath(String path){
        InputStream in =null;
        Bitmap bmp=null;
        int responseCode = -1;
        try{

            URL url = new URL(path);//"http://192.xx.xx.xx/mypath/img1.jpg
            HttpURLConnection con = (HttpURLConnection)url.openConnection();
            con.setDoInput(true);
            con.connect();
            responseCode = con.getResponseCode();
            if(responseCode == HttpURLConnection.HTTP_OK)
            {
                //download
                in = con.getInputStream();
                bmp = BitmapFactory.decodeStream(in);
                in.close();
            }

        }
        catch(Exception ex){
            LogUtil.e("Exception"+ex.toString()+"");
        }
        return bmp;
    }

    public static class LoadImageTask extends AsyncTask<Object, Void, Bitmap> {
        private ImageView imageView;
        private ProgressDialog progressDialog;
        private Context context;
        public LoadImageTask(Context context) {
            this.context = context;
        }

        @Override
        protected void onPreExecute() {
            super.onPreExecute();

            // 在异步任务执行前显示ProgressDialog
            progressDialog = new ProgressDialog(context);
            progressDialog.setMessage("加载中...");
            progressDialog.setCancelable(false); // 设置为不可取消
            progressDialog.show();
        }

        @Override
        protected Bitmap doInBackground(Object... params) {
            String imageUrl = (String) params[0];
            imageView = (ImageView) params[1];
            try {
                // 使用URL加载图片
                URL url = new URL(imageUrl);
                HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                connection.setDoInput(true);
                connection.connect();
                InputStream inputStream = connection.getInputStream();

                // 将输入流转换为Bitmap对象
                Bitmap bitmap = BitmapFactory.decodeStream(inputStream);

                inputStream.close();
                connection.disconnect();

                return bitmap;
            } catch (IOException e) {
                e.printStackTrace();
            }

            return null;
        }
        @Override
        protected void onPostExecute(Bitmap result) {
            if (result != null) {
                // 在ZoomageView中显示加载的图片
                imageView.setImageBitmap(result);
            }
            // 请求完成后，隐藏ProgressDialog
            if (progressDialog != null && progressDialog.isShowing()) {
                progressDialog.dismiss();
            }
        }
    }

}