# Envia bytes brutos (ZPL) para uma impressora instalada no Windows via
# spooler (datatype RAW) — o caminho clássico winspool/RawPrinterHelper.
# Uso: powershell -NoProfile -ExecutionPolicy Bypass -File imprimir-raw.ps1 -Printer "<nome>" -Path "<arquivo>"
param(
  [Parameter(Mandatory = $true)][string]$Printer,
  [Parameter(Mandatory = $true)][string]$Path
)

$ErrorActionPreference = "Stop"

Add-Type -TypeDefinition @"
using System;
using System.IO;
using System.Runtime.InteropServices;

public class RawPrinterHelper
{
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct DOCINFO
    {
        [MarshalAs(UnmanagedType.LPWStr)] public string pDocName;
        [MarshalAs(UnmanagedType.LPWStr)] public string pOutputFile;
        [MarshalAs(UnmanagedType.LPWStr)] public string pDatatype;
    }

    [DllImport("winspool.drv", CharSet = CharSet.Unicode, SetLastError = true)]
    static extern bool OpenPrinter(string pPrinterName, out IntPtr phPrinter, IntPtr pDefault);
    [DllImport("winspool.drv", SetLastError = true)]
    static extern bool ClosePrinter(IntPtr hPrinter);
    [DllImport("winspool.drv", CharSet = CharSet.Unicode, SetLastError = true)]
    static extern bool StartDocPrinter(IntPtr hPrinter, int level, ref DOCINFO di);
    [DllImport("winspool.drv", SetLastError = true)]
    static extern bool EndDocPrinter(IntPtr hPrinter);
    [DllImport("winspool.drv", SetLastError = true)]
    static extern bool StartPagePrinter(IntPtr hPrinter);
    [DllImport("winspool.drv", SetLastError = true)]
    static extern bool EndPagePrinter(IntPtr hPrinter);
    [DllImport("winspool.drv", SetLastError = true)]
    static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);

    public static void SendFile(string printerName, string filePath)
    {
        byte[] bytes = File.ReadAllBytes(filePath);
        IntPtr hPrinter;
        if (!OpenPrinter(printerName, out hPrinter, IntPtr.Zero))
            throw new Exception("Impressora nao encontrada: " + printerName);
        try
        {
            DOCINFO di = new DOCINFO();
            di.pDocName = "Etiqueta Santo Favo";
            di.pDatatype = "RAW";
            if (!StartDocPrinter(hPrinter, 1, ref di))
                throw new Exception("Falha ao iniciar documento no spooler.");
            try
            {
                StartPagePrinter(hPrinter);
                IntPtr unmanaged = Marshal.AllocHGlobal(bytes.Length);
                try
                {
                    Marshal.Copy(bytes, 0, unmanaged, bytes.Length);
                    int written;
                    if (!WritePrinter(hPrinter, unmanaged, bytes.Length, out written) || written != bytes.Length)
                        throw new Exception("Falha ao gravar bytes na impressora.");
                }
                finally { Marshal.FreeHGlobal(unmanaged); }
                EndPagePrinter(hPrinter);
            }
            finally { EndDocPrinter(hPrinter); }
        }
        finally { ClosePrinter(hPrinter); }
    }
}
"@

[RawPrinterHelper]::SendFile($Printer, $Path)
Write-Output "OK"
