import {
    createServer
} from "node:http"

import {
    readFile
} from "node:fs/promises"

import {
    extname,
    join
} from "node:path"

import {
    fileURLToPath
} from "node:url"


const root = fileURLToPath(
    new URL(".", import.meta.url)
)


const mimeTypes = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css"
}


const server = createServer(
    async (request, response) => {

        try {
            const pathname = new URL(request.url, "http://localhost").pathname

            let filePath = join(root, pathname === "/" ? "/index.html" : pathname)

            let data
            try {
                data = await readFile(filePath)
            } catch (error) {
                if (extname(pathname)) throw error
                filePath = join(root, "/index.html")
                data = await readFile(filePath)
            }

            const extension =
                extname(filePath)

            response.writeHead(
                200,
                {
                    "Content-Type":
                        mimeTypes[extension] ||
                        "text/plain"
                }
            )

            response.end(data)

        } catch {
            response.writeHead(404)
            response.end("Not found")
        }
    }
)


server.listen(3000, () => {
    console.log(
        "http://localhost:3000"
    )
})
