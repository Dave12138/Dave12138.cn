package cn.dave12138.servlet;

import cn.dave12138.logic.DatabaseConnection;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

public class FileServlet extends DesignedServlet {

    private static final Map<String, Date> DATE_MAP = new HashMap<>();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        doPost(req, resp);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String file = java.net.URLDecoder.decode(req.getRequestURI().substring("/".length()), StandardCharsets.UTF_8);
        if (!DATE_MAP.containsKey(file)) {
            DATE_MAP.put(file, new Date());
        }
        OutputStream out = resp.getOutputStream();
        try {
            setContentType(req, resp, file);
            String fileName = file.substring(file.lastIndexOf('/') + 1);

            InputStream fis = getServletContext().getResourceAsStream(file);
            if (fis != null) {
                byte[] data = new byte[1024];
                int l;
                while ((l = fis.read(data)) > 0) {
                    out.write(data, 0, l);
                }
                fis.close();
            } else {

                DatabaseConnection db = new DatabaseConnection(getServletContext());
                try {

                    if (req.getParameterMap().containsKey("delete")) {
                        db.removeFile(fileName);

                    } else {
                        byte[][] bytes = db.getFile(fileName);
                        if (bytes.length < 1) {
                            log("找不到" + file);
                            toRoot(resp);
                            return;
                        }
                        for (byte[] bys : bytes) {
                            out.write(bys);
                        }
                    }
                } finally {
                    db.close();
                }

            }

        } catch (Exception e) {
            out.write("数据库离线".getBytes(StandardCharsets.UTF_8));
            //toRoot(resp);
        }

    }

    private void setContentType(HttpServletRequest req, HttpServletResponse resp, String file) {
        resp.setContentType(getServletContext().getMimeType(file));
        if (file.endsWith(".jfif")) resp.setContentType("image/jpeg");
        if (req.getParameterMap().containsKey("download")) {
            resp.setHeader("Content-Disposition", "attachment;fileName=" + file.substring(file.indexOf('/')));
        }
    }

    @Override
    protected long getLastModified(HttpServletRequest req) {

        String file = java.net.URLDecoder.decode(req.getRequestURI().substring("/".length()), StandardCharsets.UTF_8);
        if (!DATE_MAP.containsKey(file)) {
            DATE_MAP.put(file, new Date());
        }
        return DATE_MAP.get(file).getTime();
    }

}
