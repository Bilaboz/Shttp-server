const net = require("net");
const fs = require("fs");
const path = require("path");
const { httpCodes, httpMessages } = require("../utils/httpCodes");
const { port, host, webDirPath } = require("../config/config.json");

const handle = (conn) => {
    console.log(`New incomming connection: ${conn.remoteAddress}`);
    conn.setEncoding("utf-8");

    conn.on("end", () => {
        console.log("Client disconnected");
    });

    conn.on("data", async (data) => {
        const reqLine = data.substring(0, data.indexOf("\r\n")).split(" ");
        const method = reqLine[0];
        let ressource = reqLine[1];
        const httpVersion = reqLine[2];
        
        console.log(method, ressource)
        switch(method) {
            case "GET":
                let gHeaders = data.trim().split("\r\n").slice(1);
                for (i in gHeaders) {
                    gHeaders[i] = gHeaders[i].split(": ");
                }
                gHeaders = Object.fromEntries(gHeaders);

                const ressourceData = await getRessource(ressource);
                conn.write(`${httpVersion} ${ressourceData.code} ${httpCodes[ressourceData.code]}\r\n`);
                conn.write("Server: Shttp\r\n")
                if (!ressourceData.data) {
                    conn.write("\r\n");
                    conn.write(httpMessages[ressourceData.code]);
                } else {
                    conn.write(`Content-Length: ${ressourceData.size}\r\n`);
                    conn.write("\r\n");
                    conn.write(ressourceData.data);
                }
                conn.end();
                break;
            case "POST":
                let pHeaders = data.trim().split("\r\n").slice(1).slice(0, -2);
                for (i in pHeaders) {
                    pHeaders[i] = pHeaders[i].split(": ");
                }
                pHeaders = Object.fromEntries(pHeaders);
                
                if (!pHeaders["Content-Type"] || pHeaders["Content-Type"] !== "application/json") {
                    conn.write(`${httpVersion} 415 UNSUPPORTED MEDIA TYPE\r\n`);
                    conn.write("\r\n");
                    conn.write("Content-Type must be application/json");
                    return conn.end();
                }

                let payload = data.substring(data.indexOf("{") + 1, data.indexOf("}"));
                payload = JSON.parse("{" + payload + "}");
                
                if (ressource.startsWith("/")) ressource = ressource.slice(1);
                if (path.isAbsolute(ressource)) {
                    conn.write(`${httpVersion} 403 ${httpCodes[403]}\r\n`);
                    conn.write("\r\n");
                    conn.write(httpMessages[403]);
                    return conn.end();
                }
                const targetPath = path.join(webDirPath, ressource);

                if (fs.existsSync(targetPath)) {
                    conn.write(`${httpVersion} 400 ${httpCodes[400]}\r\n`);
                    conn.write("\r\n");
                    conn.write("A file with the same name already exists!");
                    return conn.end();
                }

                try {
                    fs.writeFileSync(targetPath, JSON.stringify(payload, null, 4));
                } catch (err) {
                    conn.write(`${httpVersion} 500 ${httpCodes[500]}\r\n`);
                    conn.write("\r\n");
                    conn.write(httpMessages[500]);
                    return conn.end();
                }

                conn.write(`${httpVersion} 200 ${httpCodes[200]}\r\n`);
                conn.write("\r\n");
                conn.write(`Successfully created ressource. It is available at /${ressource}`);

                conn.end();
                break;
            default:
                conn.write(`${httpVersion} 405 ${httpCodes[405]}\r\n`);
                conn.write("\r\n");
                conn.write(httpMessages[405]);
                conn.end();
                break;

        }
    });

    conn.on('error', (err, socket) => {
        if (err.code === 'ECONNRESET' || !socket.writable) {
            return;
        }
    });
}

const getRessource = async (ressource) => {
    if (ressource.startsWith("/")) ressource = ressource.slice(1);

    if (path.isAbsolute(ressource)) {
        return { code: 403 };
    }

    const ressourcePath = path.join(webDirPath, ressource);

    if (fs.existsSync(ressourcePath) && !fs.statSync(ressourcePath).isDirectory()) {
        try {
            const file = fs.readFileSync(ressourcePath, { encoding: "utf-8" });
            const stats = fs.statSync(ressourcePath);
            return {
                data: file,
                size: stats.size,
                code: 200
            };
        } catch (err) {
            if (err.code === "ENOENT") {
                return { code: 404 };
            } else {
                return { code: 500 };
            }
        }
    } else {
        return { code: 404 };
    }
}

const server = net.createServer(handle);

server.listen(port, host, () => {
    console.log(`Server listening at port ${port}`);
});