import fetch from 'node-fetch'
import slugify from 'slugify'

// The place where new shared notes should go
const API_FILE_TARGET =
    'https://api.github.com/repos/cbeauhilton/links/contents/links/'

// Helper function to clean strings for frontmatter
const sanitize = (str) => {
    // replace endash and emdash with hyphens
    str = str.replace(/–/g, '-')
    str = str.replace(/—/g, '-')

    // replace double quotes and apostrophes
    str = str.replace(/"/g, "'")
    str = str.replace(/“/g, "'")
    str = str.replace(/”/g, "'")
    str = str.replace(/’/g, "'")

    return str.trim()
}

// generate file content - should just pass through the JSON
const getFileContent = (data) => {
    const { title, url, body} = data
    
    return unescape(encodeURIComponent(content))
}

// generate file name
const getFileName = (params) => {
    const { title, datetime } = params

    if (!title) {
        filename = `${datetime}`
    } else {
        const slug = slugify(title, {
            remove: /[^a-z0-9 ]/gi,
            lower: true
        })
        filename += slug.length > 1 ? `-${slug}` : `-${datetime}`
    }

    return `${filename}.json`
}

// create the new file via the github API
const postFile = async (params) => {
    const { title, datetime, token } = params
    const fileName = getFileName(title, datetime)
    const fileContent = getFileContent(params) // needs some work here
    const url = API_FILE_TARGET + fileName

    const payload = {
        message: 'new shared note',
        content: Buffer.from(fileContent).toString('base64'),
        committer: {
            name: 'beau hilton',
            email: 'beau@beauhilton.com'
        }
    }

    const options = {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/vnd.github.v3+json',
            Authorization: `token ${token}`
        },
        body: JSON.stringify(payload)
    }

    return await fetch(url, options)
}

// helper function to handle API responses
const handleResponse = (response) => {
    if (response.ok) {
        return {
            statusCode: 200,
            body: `Note published!`
        }
    }

    return {
        statusCode: response.status,
        body: `${response.statusText}`
    }
}

// Main Lambda Function
exports.handler = async (event) => {
    try {
        const params = JSON.parse(event.body)

        // Only allow POST
        if (event.httpMethod !== 'POST') {
            return { statusCode: 405, body: 'Method Not Allowed' }
        }

        // Token is required
        if (!params.token) {
            return { statusCode: 403, body: 'Missing Access Token' }
        }

        const response = await postFile(params)
        return handleResponse(response)
    } catch (err) {
        console.log(err)
        return {
            statusCode: 400,
            body: err.toString()
        }
    }
}
