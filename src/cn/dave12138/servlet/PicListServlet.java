package cn.dave12138.servlet;

import cn.dave12138.logic.DatabaseConnection;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.sql.SQLException;
import java.util.Map;

public class PicListServlet extends HttpServlet {
    private static final int IMAGE_COUNT_EACH_PAGE = 4;
    private static int PAGE_COUNT = Integer.MAX_VALUE;

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("text/html");
        OutputStream out = resp.getOutputStream();
        Map<String, String[]> map = req.getParameterMap();
        int page = 0;
        if (map.containsKey("page")) {
            try {
                page = Integer.decode(map.get("page")[0]);
            } catch (Exception ignore) {
                resp.sendRedirect(req.getRequestURI());
                return;
            } finally {
                if (page < 0)
                    resp.sendRedirect(req.getRequestURI());
            }
        }
        out.write("<!DOCTYPE html>\n<html lang=\"zh\"><meta charset=\"utf-8\" http-equiv=\"Content-Type\" content=\"text/html\"/><head><title>图床？</title><link rel=\"stylesheet\" type=\"text/css\" href=\"/CSS/PicList.css\"/></head><body><div id=\"wrapper\"><div id=\"header\"></div><div id=\"content\">".getBytes(StandardCharsets.UTF_8));
        try {
            out.write("<div class='sub-content'>".getBytes(StandardCharsets.UTF_8));
            DatabaseConnection db = new DatabaseConnection(getServletContext());
            String[] imageNames = db.images(page, IMAGE_COUNT_EACH_PAGE);
            if (page > 0 && imageNames.length == 0) {
                PAGE_COUNT = db.getImagePageCount(IMAGE_COUNT_EACH_PAGE);
                resp.sendRedirect(req.getRequestURI() + "?page=" + (PAGE_COUNT - 1));

            }
            for (String s : imageNames) {
                out.write(String.format("<div class='image-box'><img class='thumb' alt='%1$s' title='%1$s' src='/images/%1$s'/></div>", s).getBytes(StandardCharsets.UTF_8));
            }

            out.write("</div>".getBytes(StandardCharsets.UTF_8));
            out.write("</div><div id=\"footer\">".getBytes());
            if (page > 0) {
                out.write("<button id=\"pre-page\" >上一页</button>".getBytes(StandardCharsets.UTF_8));
            }
            out.write(String.format("\t<input type=\"number\" min=\"0\" max=\"%d\" id=\"page_number\" value=\"%d\"/>\t", PAGE_COUNT - 1, page).getBytes(StandardCharsets.UTF_8));
            if (page + 1 < PAGE_COUNT) {
                out.write("<button id=\"next-page\">下一页</button>".getBytes(StandardCharsets.UTF_8));
            }
        } catch (SQLException e) {
            //e.printStackTrace();
            out.write("数据库离线".getBytes(StandardCharsets.UTF_8));
        }
        out.write("</div>".getBytes(StandardCharsets.UTF_8));
        out.write("</div><script src=\"/JavaScript/PicList.js\"></script></body></html>".getBytes(StandardCharsets.UTF_8));
    }
}
