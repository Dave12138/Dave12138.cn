package cn.dave12138.servlet;

import javax.servlet.ServletOutputStream;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.InputStream;
import java.io.UnsupportedEncodingException;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Set;

public abstract class DesignedServlet extends HttpServlet {


    protected void printFile(HttpServletResponse resp, String file) throws IOException {
        ServletOutputStream outStream = resp.getOutputStream();
        InputStream fis = getServletContext().getResourceAsStream(file);
        byte[] data = new byte[1024];
        int l;
        while ((l = fis.read(data)) > 0) {
            outStream.write(data, 0, l);
        }
        fis.close();
        outStream.write(data, 0, l);
    }

    protected void toRoot(HttpServletResponse resp) throws IOException {
        resp.sendRedirect("/");
    }

    protected Map<String, String[]> getFixedRequest(HttpServletRequest req) throws UnsupportedEncodingException {
        Map<String, String[]> p = req.getParameterMap();
        Set<String> k = p.keySet();
        for (String kk : k) {
            String[] arr = p.get(kk);
            for (int i = 0; i < arr.length; i++) {
                arr[i] = new String(arr[i].getBytes(StandardCharsets.UTF_8), "GBK");
            }
        }
        return p;
    }
}
