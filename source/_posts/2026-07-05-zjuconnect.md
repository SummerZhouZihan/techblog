---
title:      "使用Clash与ZJUConnect同时访问内外网方法"
subtitle:   " \"在 Windows 上同时访问浙江大学校内网和外网代理\""
date:       2026-07-05 8:00:00
author:     "Summer&GPT"
banner_img: /img/head/image6.jpg
math: true
tags:
    - 科研
categories: 科研
excerpt: "在 Windows 上同时访问浙江大学校内网和外网代理"
---

本文记录在 Windows 上用 **zju-connect + Clash Party（Mihomo 内核）** 同时访问浙江大学校内网和外网代理的配置过程。目标是校内域名和校内 IP 走 zju-connect，Google 等墙外网站继续走 Clash 代理节点，国内普通网站照常直连。

本机已验证的状态：

- zju-connect 监听 `127.0.0.1:1090`（SOCKS5）和 `127.0.0.1:1091`（HTTP）。
- Clash Party 监听 `127.0.0.1:7890/7891/7892`。
- `https://www.google.com` 通过 Clash 返回 `HTTP 200`。
- `https://www.cc98.org` 通过 Clash 返回 `HTTP 200`，zju-connect 日志显示解析到 `10.10.98.98` 并走 `VPN`。

## 整体思路

流量路径如下：

```text
浏览器 / 系统代理应用
        |
        v
Clash Party / Mihomo
        |
        |-- 校内域名和 10.0.0.0/8、172.16.0.0/12 -> ZJUconnect -> VPN -> 校内网
        |-- Google、GitHub 等外网 -> Clash 代理节点
        |-- 普通国内网站 -> DIRECT
```

zju-connect 不接管系统路由，只在本地开一个 SOCKS5/HTTP 代理端口。Clash 负责分流，把校内流量转发给 zju-connect。

当前实测基于 Clash Party 的**系统代理模式**。如果要让不读取系统代理的程序也透明走 Clash，需要打开 Clash Party 的 TUN；启用 TUN 时要特别注意回环问题，见文末排错部分。

## 一、准备 zju-connect

下载：

```text
zju-connect-windows-386/zju-connect.exe
```

确认版本和认证方式：

```powershell
.\zju-connect-windows-386\zju-connect.exe -version
.\zju-connect-windows-386\zju-connect.exe -protocol atrust -server vpn.zju.edu.cn -port 443 -auth-info
```

本机输出显示 `Radius` + `auth/psw` 可用：

```json
[
  {
    "loginDomain": "Radius",
    "authType": "auth/psw",
    "authName": "上网账号"
  }
]
```

## 二、zju-connect 配置

创建 `config.toml`。密码不要长期写在文档或公开配置里；下面用占位符表示。

```toml
protocol = "atrust"
server_address = "vpn.zju.edu.cn"
server_port = 443
username = "<学号>"
password = ""

socks_bind = "127.0.0.1:1090"
http_bind = "127.0.0.1:1091"

disable_zju_config = false
disable_zju_dns = false
dns_ttl = 3600
disable_keep_alive = false
zju_dns_server = "auto"
secondary_dns_server = "114.114.114.114"
debug_dump = false

port_forwarding = []
custom_dns = []
custom_proxy_domain = []

auth_type = "auth/psw"
login_domain = "Radius"
client_data_file = "client_data.json"
graph_code_file = ""
update_best_nodes_interval = 300
```

首次登录需要图形验证码，可能还会触发短信验证码。建议先手动跑一次，拿到 `client_data.json`：

```powershell
.\zju-connect-windows-386\zju-connect.exe `
  -protocol atrust `
  -server vpn.zju.edu.cn `
  -port 443 `
  -username <你的学号> `
  -password <你的密码> `
  -socks-bind 127.0.0.1:1090 `
  -http-bind 127.0.0.1:1091 `
  -auth-type auth/psw `
  -login-domain Radius `
  -client-data-file client_data.json `
  -zju-dns-server auto `
  -secondary-dns-server 114.114.114.114
```

登录成功后日志里应该出现：

```text
VPN client started
Use DNS server 10.10.0.21 provided by server
SOCKS5 server listening on 127.0.0.1:1090
HTTP server listening on 127.0.0.1:1091
KeepAlive using UDP: OK
```

`client_data.json` 保存登录会话。下次启动时通常会显示 `Already logged in`，不再要求图形验证码和短信验证码。

## 三、配置 Clash Party / Mihomo

Clash 里要增加一个指向 zju-connect 的 SOCKS5 节点，再建一个“校园网”策略组。

在当前目录保存一份覆写片段：

```yaml
+proxies:
  - name: ZJUconnect
    type: socks5
    server: 127.0.0.1
    port: 1090
    udp: true

+proxy-groups:
  - name: 校园网
    type: select
    proxies:
      - ZJUconnect
      - DIRECT

+rules:
  - DOMAIN,vpn.zju.edu.cn,DIRECT
  - DOMAIN,rvpn.zju.edu.cn,DIRECT
  - DOMAIN,webvpn.zju.edu.cn,DIRECT
  - DOMAIN-SUFFIX,zju.edu.cn,校园网
  - DOMAIN-SUFFIX,zjusec.com,校园网
  - DOMAIN-SUFFIX,cc98.org,校园网
  - IP-CIDR,10.0.0.0/8,校园网,no-resolve
  - IP-CIDR,172.16.0.0/12,校园网,no-resolve
```

Clash Party 的全局覆写文件位于：

```text
C:\Users\<用户名>\AppData\Roaming\mihomo-party\override.yaml
```

本次采用的登记方式：

```yaml
items:
  - id: zju-connect-campus
    name: ZJU Connect Campus
    type: local
    ext: yaml
    global: true
    updated: <时间戳>
```

对应的覆写文件位于：

```text
C:\Users\<用户名>\AppData\Roaming\mihomo-party\override\zju-connect-campus.yaml
```

把上面的 `+proxies`、`+proxy-groups`、`+rules` 内容写入这个文件。

## 四、处理规则顺序

这一步很关键。Clash 规则是从上到下匹配，命中后就不继续往下看。

本机原来的规则里有：

```yaml
prepend:
  - DOMAIN-SUFFIX,webvpn.zju.edu.cn,DIRECT
  - DOMAIN-SUFFIX,zju.edu.cn,DIRECT
  - DOMAIN-SUFFIX,momodel.cn,DIRECT
  - 1,DOMAIN-SUFFIX,cc98.org,DIRECT
```

这些规则排在 `校园网` 规则前面，会导致 `zju.edu.cn` 和 `cc98.org` 继续直连，zju-connect 接不到流量。

最终把本地规则改成：

```yaml
prepend:
  - DOMAIN,vpn.zju.edu.cn,DIRECT
  - DOMAIN,rvpn.zju.edu.cn,DIRECT
  - DOMAIN,webvpn.zju.edu.cn,DIRECT
  - DOMAIN-SUFFIX,zju.edu.cn,校园网
  - DOMAIN-SUFFIX,zjusec.com,校园网
  - DOMAIN-SUFFIX,cc98.org,校园网
  - IP-CIDR,10.0.0.0/8,校园网,no-resolve
  - IP-CIDR,172.16.0.0/12,校园网,no-resolve
  - DOMAIN-SUFFIX,momodel.cn,DIRECT
append: []
delete: []
```

在 Clash Party 中，这类规则文件通常在：

```text
C:\Users\<用户名>\AppData\Roaming\mihomo-party\rules\<profile-id>.yaml
```

改完后重启 Clash Party，让它重新生成：

```text
C:\Users\<用户名>\AppData\Roaming\mihomo-party\work\config.yaml
```

生成后的 `rules:` 前几行应该类似：

```yaml
rules:
  - DOMAIN,vpn.zju.edu.cn,DIRECT
  - DOMAIN,rvpn.zju.edu.cn,DIRECT
  - DOMAIN,webvpn.zju.edu.cn,DIRECT
  - DOMAIN-SUFFIX,zju.edu.cn,校园网
  - DOMAIN-SUFFIX,zjusec.com,校园网
  - DOMAIN-SUFFIX,cc98.org,校园网
  - IP-CIDR,10.0.0.0/8,校园网,no-resolve
  - IP-CIDR,172.16.0.0/12,校园网,no-resolve
```

`vpn.zju.edu.cn`、`rvpn.zju.edu.cn`、`webvpn.zju.edu.cn` 必须直连。否则 zju-connect 自己连接 VPN 服务器时可能被 Clash 转回 zju-connect，形成回环。

## 五、启动顺序

推荐顺序：

1. 启动 zju-connect，确认 `1090/1091` 已监听。
2. 启动或重启 Clash Party。
3. 在 Clash Party 的策略组中确认“校园网”选择 `ZJUconnect`。
4. 打开系统代理，或者在应用里设置代理为 `127.0.0.1:7890`。

检查端口：

```powershell
Get-NetTCPConnection -State Listen |
  Where-Object { $_.LocalPort -in 7890,7891,7892,1090,1091 } |
  Select-Object LocalAddress,LocalPort,OwningProcess |
  Sort-Object LocalPort
```

期望看到：

```text
127.0.0.1  1090  zju-connect
127.0.0.1  1091  zju-connect
127.0.0.1  7890  mihomo
127.0.0.1  7891  mihomo
127.0.0.1  7892  mihomo
```

## 六、验证

验证外网代理：

```powershell
curl.exe -sS -o NUL `
  -w "google_via_clash http=%{http_code} remote=%{remote_ip} total=%{time_total}`n" `
  --max-time 20 `
  --proxy http://127.0.0.1:7890 `
  https://www.google.com
```

本机实测：

```text
google_via_clash http=200 remote=127.0.0.1 total=1.185205
```

验证校内网通过 Clash 分流：

```powershell
curl.exe -sS -o NUL `
  -w "cc98_via_clash http=%{http_code} remote=%{remote_ip} total=%{time_total}`n" `
  --max-time 20 `
  --proxy http://127.0.0.1:7890 `
  https://www.cc98.org
```

本机实测：

```text
cc98_via_clash http=200 remote=127.0.0.1 total=1.773973
```

直接验证 zju-connect：

```powershell
curl.exe -sS -o NUL `
  -w "cc98_via_zju_socks http=%{http_code} remote=%{remote_ip} total=%{time_total}`n" `
  --max-time 20 `
  --socks5-hostname 127.0.0.1:1090 `
  https://www.cc98.org
```

本机实测：

```text
cc98_via_zju_socks http=200 remote=127.0.0.1 total=0.073358
```

zju-connect 日志里能看到：

```text
www.cc98.org -> 10.10.98.98
10.10.98.98:443 -> VPN
KeepAlive using UDP: OK
```

这说明校内域名不是普通直连，而是走了 zju-connect 的 VPN 通道。

## 七、常见问题

### 1. 验证码页面显示 Network error

zju-connect 的图形验证码服务有超时时间。本次遇到的日志：

```text
failed to get captcha input: captcha input timed out after 5m0s
```

处理办法：重新启动 zju-connect，打开新的 `http://127.0.0.1:<端口>` 验证码页面。

### 2. 图形验证码通过后短信验证码无法输入

如果 zju-connect 被隐藏后台启动，短信验证码会要求从标准输入读取，但没有可输入的终端，日志会出现：

```text
Please enter the SMS verification code:
Login error: EOF
```

处理办法：首次登录用可见 PowerShell 窗口运行 zju-connect，短信码直接在窗口里输入。成功拿到 `client_data.json` 后，再改成后台启动。

### 3. Clash 里有 ZJUconnect，但校内站点仍不走 VPN

看规则顺序。`DOMAIN-SUFFIX,zju.edu.cn,DIRECT` 如果排在 `DOMAIN-SUFFIX,zju.edu.cn,校园网` 前面，就会先命中 DIRECT。

检查：

```powershell
Select-String `
  -LiteralPath "$env:APPDATA\mihomo-party\work\config.yaml" `
  -Pattern "ZJUconnect|校园网|zju.edu.cn|10.0.0.0/8" `
  -Encoding UTF8
```

确保校园网规则在旧的 DIRECT 规则前面，或者直接删除旧的 DIRECT 规则。

### 4. 端口冲突

Clash Party 常用 `7890/7891/7892`，所以 zju-connect 使用 `1090/1091`。如果启动失败，检查端口：

```powershell
Get-NetTCPConnection -State Listen |
  Where-Object { $_.LocalPort -in 1090,1091,7890,7891,7892 }
```

### 5. TUN 模式

本文实测的是 Clash Party 系统代理模式。浏览器和遵守系统代理的应用可以正常内外网共存。

如果开启 TUN，需要额外确认：

- `vpn.zju.edu.cn`、`rvpn.zju.edu.cn` 必须直连。
- 访问 `127.0.0.1:1090` 不能被 TUN 回环拦截。
- 如果 Clash Party 支持按进程排除，建议排除 `zju-connect.exe`。

TUN 打开后重新跑一遍上面的三条 `curl` 验证，不要只看配置。

## 八、当前文件清单

本目录中的关键文件：

```text
config.toml                         zju-connect 参考配置，不保存真实密码
start-zju-connect.ps1               手动启动脚本
clash-party-zju-connect.yaml        Clash Party 覆写片段备份
client_data.json                    zju-connect 登录会话文件，勿公开
zju-connect-*.log                   调试日志
```

Clash Party 中改动过的文件：

```text
%APPDATA%\mihomo-party\override.yaml
%APPDATA%\mihomo-party\override\zju-connect-campus.yaml
%APPDATA%\mihomo-party\rules\<profile-id>.yaml
```

改动前建议先备份。本文配置过程中已给 `override.yaml`、`profile.yaml` 和规则文件做过 `.bak-<时间戳>` 备份。
