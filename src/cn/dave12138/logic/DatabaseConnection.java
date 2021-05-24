package cn.dave12138.logic;

import java.io.IOException;
import java.io.InputStream;
import java.sql.*;
import java.util.Vector;

public class DatabaseConnection {
    public static final String SQL_DRIVER = "com.mysql.jdbc.Driver";
    public static final String SQL_HOST = "jdbc:mysql://192.168.108.128:3306/MyWeb?useSSL=false";
    public static final String SQL_USER = "root";
    public static final String SQL_PASSWORD = "A15604559612";
    public static final String DATE_FORMAT = "yyyy-MM-dd HH:mm";
    public static final long SIZE_LIMIT = 1024 * 1024 * 12;
    public static final long SIZE_MIN_LIMIT = 1024;

    static {

        try {
            Class.forName(SQL_DRIVER);
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        }
    }

    private final long sizeLimit;
    private Connection connection;

    public DatabaseConnection() throws SQLException {
        this(SIZE_LIMIT);
    }

    public DatabaseConnection(long sizeLimit) throws SQLException {
        connection = DriverManager.getConnection(SQL_HOST, SQL_USER, SQL_PASSWORD);
        this.sizeLimit = sizeLimit < SIZE_LIMIT && sizeLimit > SIZE_MIN_LIMIT ? sizeLimit : SIZE_LIMIT;
    }

    private static String getFixedName(String fileName) {
        fileName = fileName.replace('\'', '‘').replace('/', '、').replace(';', '；');
        return fileName;
    }


    public void close() throws SQLException {
        connection.close();
    }
/*
    public void saveBase64FilePart(String fileName, String data, String partNo, String partCount) throws SQLException {
        fileName = getFixedName(fileName);
        Statement statement = connection.createStatement();
        ResultSet pr = statement.executeQuery(String.format("select part_count from files where name like '%1$s.part%%'", fileName));
        if (pr.next() && pr.getInt("part_count") != Integer.decode(partCount)) {
            throw new SQLException("该文件名存在");
        }
        statement.executeUpdate(String.format("insert into files (name, data, part, part_count) value ('%s','%s','%s','%s')", fileName + ".part" + partNo, data, partNo, partCount));
        statement.close();
    }*/

    public void saveBinFile(String fileName, InputStream fileInputStream) throws SQLException, IOException {
        saveBinFilePart(fileName, fileInputStream, 0);
    }

    public void saveBinFilePart(String fileName, InputStream in, int partNo) throws SQLException, IOException {
        fileName = getFixedName(fileName);
        Statement statement = connection.createStatement();
        ResultSet pr = statement.executeQuery(String.format("select part from files where name like '%1$s.part%%'", fileName));
        while (pr.next()) {
            if (pr.getInt("part") == partNo) throw new SQLException("该文件名存在");
        }
        statement.close();
        String cmd = "insert into files (name, data, part) value (?, ? ,?)";
        PreparedStatement ps = connection.prepareStatement(cmd);
        while (in.available() > 0) {
            ps.setString(1, fileName + ".part" + partNo);
            ps.setBlob(2, in, sizeLimit);
            ps.setInt(3, partNo);
            ps.executeUpdate();
            partNo++;
        }
        ps.close();

    }

  /*  public String getBase64File(String fileName) throws SQLException {
        fileName = getFixedName(fileName);
        Statement statement = connection.createStatement();
        ResultSet res = statement.executeQuery(String.format("select * from files where `name` like '%s.part%%' and removed = 0", fileName));
        String[] list = null;
        while (res.next()) {
            if (list == null) list = new String[res.getInt("part_count")];
            list[res.getInt("part")] = res.getString("data");
        }
        statement.close();
        if (list == null) {
            return "";
        }
        return String.join("", list);
    }*/

    public byte[][] getFile(String fileName) throws SQLException {
        fileName = getFixedName(fileName);
        Vector<byte[]> bytes = new Vector<>();
        PreparedStatement stm = connection.prepareStatement("select * from files where name like ? and removed = 0");
        stm.setString(1, fileName + ".part%");
        ResultSet res = stm.executeQuery();
        while (res.next()) {
            byte[] bys = res.getBytes("data");
            bytes.add(bys);
        }
        return bytes.toArray(new byte[0][]);
    }

    public boolean removeFile(String fileName) throws SQLException {
        fileName = getFixedName(fileName);
        PreparedStatement statement = connection.prepareStatement("update files set removed = 1 , `name` = concat('(removed)',`name`)  where `name` like ?");
        statement.setString(1, fileName + ".part%");
        int res = statement.executeUpdate();
        statement.close();
        return res > 0;
    }

    public String[] images(int page, int count) throws SQLException {

        Statement statement = connection.createStatement();
        ResultSet res = statement.executeQuery(String.format("select `name` from files where removed = 0 and (`name` like '%%.jpg.part0' or `name` like '%%.gif.part0' or `name` like '%%.jpeg.part0' or `name` like '%%.svg.part0' or `name` like '%%.png.part0' or `name` like '%%.jfif.part0') limit %d offset %d", count, page * count));
        Vector<String> list = new Vector<>();
        while (res.next()) {
            String name = res.getString("name").replace(".part0", "");
            list.add(name);
        }
        statement.close();
        return list.toArray(new String[0]);
    }

    public long getSizeLimit() {
        return sizeLimit;
    }
}
