package cn.dave12138.servlet;

import cn.dave12138.logic.DatabaseConnection;

import javax.servlet.ServletException;
import javax.servlet.annotation.MultipartConfig;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.Part;
import java.io.IOException;
import java.io.InputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@MultipartConfig
public class UploadServlet extends DesignedServlet {
    private static final int FILE_CHUNK_SIZE = 1024 * 1024 * 3;

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {

        String file = "";
        try {
            Part filePart = req.getPart("uploadFiles");
            file = (filePart.getSubmittedFileName());
            int s;
            DatabaseConnection db = new DatabaseConnection();
            InputStream in = filePart.getInputStream();
            db.saveBinFile(file, in);




           /* byte[] bytes = new byte[FILE_CHUNK_SIZE];
            Vector<byte[]> fv = new Vector<>();
            while ((s = in.read(bytes)) > 0) {
                if (s < bytes.length) {
                    bytes = Arrays.copyOf(bytes, s);
                }
                byte[] base = Base64.getEncoder().encode(bytes);
                fv.add(base);
            }
            int No = 0;
            String count = String.valueOf(fv.size());
            for (byte[] base : fv) {

                db.saveFilePart(file, new String(base), String.valueOf(No++), count);

            }*/
            db.close();
            resp.sendRedirect("/html/Hello.html?fileUploaded=" + URLEncoder.encode(file, StandardCharsets.UTF_8));

        } catch (Exception ex) {
            resp.sendRedirect("/html/Hello.html?failUploaded=" + URLEncoder.encode(file, StandardCharsets.UTF_8));

        }
    }


}
