import { serveStatic } from 'hono/serve-static';

// Add this to your Hono app
app.use('/property-images/*', serveStatic({ root: 'C:/PROJECT/property_images' }));