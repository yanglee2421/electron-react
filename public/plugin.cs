using System;
using System.Data;
using System.Data.OleDb;
using Newtonsoft.Json;

class Program
{
    static void Main(string[] args)
    {
        // 设置数据库路径和SQL语句
        string databasePath = args[0];  // 请替换为你的数据库路径
        string sqlQuery = args[1];  // 请替换为你的SQL查询语句
        Console.OutputEncoding = System.Text.Encoding.UTF8;

        // 调用方法获取查询结果
        string result = GetDataFromAccessDatabase(databasePath, sqlQuery);

        // 打印查询结果
   
        Console.WriteLine(result);
    }

    static string GetDataFromAccessDatabase(string databasePath, string sqlQuery)
    {
        // 创建数据库连接字符串
        string connectionString = @"Provider=Microsoft.Jet.OLEDB.4.0;Jet OLEDB:DataBase Password='Joney';Data source=" + databasePath;

        // 创建连接对象
        using (OleDbConnection connection = new OleDbConnection(connectionString))
        {
            try
            {
                // 打开数据库连接
                connection.Open();

                // 创建命令对象
                OleDbCommand command = new OleDbCommand(sqlQuery, connection);

                // 创建数据适配器
                OleDbDataAdapter dataAdapter = new OleDbDataAdapter(command);

                // 创建结果表
                DataTable dataTable = new DataTable();

                // 填充数据表
                dataAdapter.Fill(dataTable);

                // 将 DataTable 转换为 JSON 字符串
                string json = JsonConvert.SerializeObject(dataTable, Formatting.Indented);

                // 返回 JSON 字符串
                return json;
            }
            catch (Exception ex)
            {
                Console.WriteLine("发生错误: " + ex.Message);
                return null;
            }
        }
    }
}
