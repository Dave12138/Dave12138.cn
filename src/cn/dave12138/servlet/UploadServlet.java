package cn.dave12138.servlet;

import cn.dave12138.logic.DatabaseConnection;

import javax.servlet.ServletException;
import javax.servlet.annotation.MultipartConfig;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.Part;
import java.io.IOException;
import java.io.InputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Collection;
import java.util.Vector;

@MultipartConfig
public class UploadServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String file = "";
        try {
            Vector<String> fileNames = new Vector<>();
            DatabaseConnection db = new DatabaseConnection();
            try {
                Collection<Part> parts = req.getParts();
                for (Part filePart : parts) {
                    file = (filePart.getSubmittedFileName());
                    if (file != null) {
                        InputStream in = filePart.getInputStream();
                        db.saveBinFile(file, in);
                        fileNames.add(file);
                    } else {
                        System.out.println(filePart.getName());
                    }
                }
            } finally {
                db.close();
            }

            resp.sendRedirect("/html/Hello.html?fileUploaded=" + URLEncoder.encode(String.join(",", fileNames.toArray(new String[0])), StandardCharsets.UTF_8));

        } catch (Exception ex) {
            if (file == null) file = "";
            resp.sendRedirect("/html/Hello.html?failUploaded=" + URLEncoder.encode(file, StandardCharsets.UTF_8));
//            ex.printStackTrace();
        }
    }
}
