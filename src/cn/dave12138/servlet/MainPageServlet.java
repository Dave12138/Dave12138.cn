package cn.dave12138.servlet;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

public class MainPageServlet extends DesignedServlet {

    private static byte[] paraName(String str) {
        return paraNameStr(str).getBytes(StandardCharsets.UTF_8);
    }

    private static byte[] paraText(String str) {
        return paraTextStr(str).getBytes(StandardCharsets.UTF_8);
    }

    private static String paraNameStr(String str) {
        return String.format("<tr><td class=\"para-name\" colspan=\"2\">%1$s</td></tr>", str);
    }

    private static String paraTextStr(String str) {
        return String.format("<tr><td class=\"para-string\" colspan=\"2\">%1$s</td></tr>", str);
    }

    private static byte[] para(String name, String text) {
        return (paraNameStr(name) + paraTextStr(text)).getBytes(StandardCharsets.UTF_8);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        if (!"/".equals(req.getRequestURI())) {
            toRoot(resp);
            return;
        }

        resp.setContentType("text/html");
        OutputStream out = resp.getOutputStream();
        String str = "<!DOCTYPE html>\n<html lang=\"zh\"><meta charset=\"utf-8\" http-equiv=\"Content-Type\" content=\"text/html\"/>" +
                "<head>" +
                "<title>Dave_12138个人站</title>" +
                "<link rel=\"stylesheet\" type=\"text/css\" href=\"/CSS/InfoBox.css\"/>" +
                "<link rel=\"stylesheet\" type=\"text/css\" href=\"/CSS/叠图.css\"/>" +
                "</head><body><table class=\"start-page-table\"><tbody>";
        out.write(str.getBytes(StandardCharsets.UTF_8));

        str = "<tr><td id=\"subpage\" rowspan=\"14\" class=\"sub-page\" ></td><td colspan=\"2\" class=\"info-box-title\">用户信息</td></tr>";
        out.write(str.getBytes(StandardCharsets.UTF_8));

        str = "<tr>" +
                "<td colspan=\"2\">" +
                "<div class=\"behind-image\">" +
                "<img src=\"/images/崩坏3布洛妮娅·暗影4.png\" style=\" width:260px; height:260px\" />" +
                "<img src=\"/images/迷城骇兔全身.png\" onclick=\"JumpTo('images/')\" class=\"front-image\" />" +
                "</div>" +
                "</td></tr>";
        out.write(str.getBytes(StandardCharsets.UTF_8));

        out.write(para("用户名", "Dave_12138"));
        out.write(para("本表格来源", "我的萌白用户页"));
        out.write(para("tomcat版本", "9.0.46"));
        out.write(para("IDE", "IntelliJ IDEA"));
        out.write(para("个人状态", "原来如此，我完全懂了.png"));
        out.write(para("萌白用户框", "<div id=\"user-box-list\"><object type=\"text/x-scriptlet\" data=\"html/user-box.html\"/></div>"));


        out.write("</tbody></table>".getBytes());
        out.write("<script src=\"https://cdn.bootcdn.net/ajax/libs/jquery/3.5.1/jquery.min.js\"></script>".getBytes());
        out.write("<script src=\"/JavaScript/MainPage.js\"></script>".getBytes());
        out.write("</body></html>".getBytes());
    }
}
