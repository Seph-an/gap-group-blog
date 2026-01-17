'use strict';

const fs = require('fs-extra');
const path = require('path');
const mime = require('mime-types');
const { categories, global, about } = require('../data/data.json');

const newCategories = [
  'recruitment',
  'payroll',
  'interviews',
  'CVs',
  'careers',
  'AI',
  'new-job',
];

const newBlogs = [
  {
    title: 'The Rise of AI in Recruitment',
    description: 'How AI is changing the way we hire.',
    slug: 'the-rise-of-ai-in-recruitment',
    article: `# The Rise of AI in Recruitment

Artificial Intelligence (AI) is revolutionizing the recruitment landscape. From automated resume screening to intelligent candidate sourcing, AI-powered tools are helping companies find the right talent faster and more efficiently.

## Key Areas of Impact

*   **Candidate Sourcing:** AI algorithms can analyze millions of online profiles to identify potential candidates who match specific job requirements.
*   **Resume Screening:** Natural Language Processing (NLP) can be used to screen resumes and identify the most qualified candidates.
*   **Chatbots:** AI-powered chatbots can engage with candidates, answer their questions, and even conduct initial screening interviews.

While AI offers many benefits, it's important to be aware of the potential for bias and to ensure that AI tools are used ethically and responsibly.`,
    isFeatured: true,
    read_time: 2,
    categories: ['AI', 'recruitment'],
  },
  {
    title: 'Crafting the Perfect CV for the Modern Job Market',
    description: 'Tips and tricks for creating a CV that stands out.',
    slug: 'crafting-the-perfect-cv-for-the-modern-job-market',
    article: `# Crafting the Perfect CV for the Modern Job Market

Your CV is your first impression on a potential employer. In today's competitive job market, it's more important than ever to have a CV that is clear, concise, and tailored to the job you're applying for.

## Top Tips

1.  **Keep it to one page:** Recruiters are busy. Make it easy for them to see your key qualifications at a glance.
2.  **Use keywords:** Many companies use Applicant Tracking Systems (ATS) to screen CVs. Make sure your CV includes keywords from the job description.
3.  **Quantify your achievements:** Instead of just listing your responsibilities, provide concrete examples of your accomplishments.

By following these tips, you can create a CV that will help you land your dream job.`,
    isFeatured: true,
    read_time: 2,
    categories: ['CVs', 'careers', 'new-job'],
  },
  {
    title: 'Mastering the Art of the Interview',
    description: 'How to prepare for and ace your next job interview.',
    slug: 'mastering-the-art-of-the-interview',
    article: `# Mastering the Art of the Interview

The interview is your chance to shine. It's an opportunity to showcase your skills, experience, and personality. With the right preparation, you can ace your next interview and land the job you've always wanted.

## Preparation is Key

*   **Research the company:** Understand their mission, values, and recent news.
*   **Practice your answers:** Be prepared to answer common interview questions.
*   **Prepare your own questions:** Asking thoughtful questions shows that you're engaged and interested in the role.

Good luck!`,
    isFeatured: true,
    read_time: 2,
    categories: ['interviews', 'careers', 'new-job'],
  },
];

async function seedExampleApp() {
  // const shouldImportSeedData = await isFirstRun();

  // if (shouldImportSeedData) {
    try {
      console.log('Setting up the template...');
      await importSeedData();
      console.log('Ready to go');
    } catch (error) {
      console.log('Could not import seed data');
      console.error(error);
    }
  // } else {
  //   console.log(
  //     'Seed data has already been imported. We cannot reimport unless you clear your database first.'
  //   );
  // }
}

async function isFirstRun() {
  const pluginStore = strapi.store({
    environment: strapi.config.environment,
    type: 'type',
    name: 'setup',
  });
  const initHasRun = await pluginStore.get({ key: 'initHasRun' });
  await pluginStore.set({ key: 'initHasRun', value: true });
  return !initHasRun;
}

async function setPublicPermissions(newPermissions) {
  // Find the ID of the public role
  const publicRole = await strapi.query('plugin::users-permissions.role').findOne({
    where: {
      type: 'public',
    },
  });

  // Create the new permissions and link them to the public role
  const allPermissionsToCreate = [];
  Object.keys(newPermissions).map((controller) => {
    const actions = newPermissions[controller];
    const permissionsToCreate = actions.map((action) => {
      return strapi.query('plugin::users-permissions.permission').create({
        data: {
          action: `api::${controller}.${controller}.${action}`,
          role: publicRole.id,
        },
      });
    });
    allPermissionsToCreate.push(...permissionsToCreate);
  });
  await Promise.all(allPermissionsToCreate);
}

function getFileSizeInBytes(filePath) {
  const stats = fs.statSync(filePath);
  const fileSizeInBytes = stats['size'];
  return fileSizeInBytes;
}

function getFileData(fileName) {
  const filePath = path.join('data', 'uploads', fileName);
  // Parse the file metadata
  const size = getFileSizeInBytes(filePath);
  const ext = fileName.split('.').pop();
  const mimeType = mime.lookup(ext || '') || '';

  return {
    filepath: filePath,
    originalFileName: fileName,
    size,
    mimetype: mimeType,
  };
}

async function uploadFile(file, name) {
  return strapi
    .plugin('upload')
    .service('upload')
    .upload({
      files: file,
      data: {
        fileInfo: {
          alternativeText: `An image uploaded to Strapi called ${name}`,
          caption: name,
          name,
        },
      },
    });
}

// Create an entry and attach files if there are any
async function createEntry({ model, entry }) {
  try {
    // Actually create the entry in Strapi
    await strapi.documents(`api::${model}.${model}`).create({
      data: entry,
    });
  } catch (error) {
    console.error({ model, entry, error });
  }
}

async function checkFileExistsBeforeUpload(files) {
  const existingFiles = [];
  const uploadedFiles = [];
  const filesCopy = [...files];

  for (const fileName of filesCopy) {
    // Check if the file already exists in Strapi
    const fileWhereName = await strapi.query('plugin::upload.file').findOne({
      where: {
        name: fileName.replace(/\..*$/, ''),
      },
    });

    if (fileWhereName) {
      // File exists, don't upload it
      existingFiles.push(fileWhereName);
    } else {
      // File doesn't exist, upload it
      const fileData = getFileData(fileName);
      const fileNameNoExtension = fileName.split('.').shift();
      const [file] = await uploadFile(fileData, fileNameNoExtension);
      uploadedFiles.push(file);
    }
  }
  const allFiles = [...existingFiles, ...uploadedFiles];
  // If only one file then return only that file
  return allFiles.length === 1 ? allFiles[0] : allFiles;
}

async function updateBlocks(blocks) {
  const updatedBlocks = [];
  for (const block of blocks) {
    if (block.__component === 'shared.media') {
      const uploadedFiles = await checkFileExistsBeforeUpload([block.file]);
      // Copy the block to not mutate directly
      const blockCopy = { ...block };
      // Replace the file name on the block with the actual file
      blockCopy.file = uploadedFiles;
      updatedBlocks.push(blockCopy);
    } else if (block.__component === 'shared.slider') {
      // Get files already uploaded to Strapi or upload new files
      const existingAndUploadedFiles = await checkFileExistsBeforeUpload(block.files);
      // Copy the block to not mutate directly
      const blockCopy = { ...block };
      // Replace the file names on the block with the actual files
      blockCopy.files = existingAndUploadedFiles;
      // Push the updated block
      updatedBlocks.push(blockCopy);
    } else {
      // Just push the block as is
      updatedBlocks.push(block);
    }
  }

  return updatedBlocks;
}



async function importGlobal() {
  const favicon = await checkFileExistsBeforeUpload(['favicon.png']);
  const shareImage = await checkFileExistsBeforeUpload(['default-image.png']);
  return createEntry({
    model: 'global',
    entry: {
      ...global,
      favicon,
      // Make sure it's not a draft
      publishedAt: Date.now(),
      defaultSeo: {
        ...global.defaultSeo,
        shareImage,
      },
    },
  });
}

async function importAbout() {
  const updatedBlocks = await updateBlocks(about.blocks);

  await createEntry({
    model: 'about',
    entry: {
      ...about,
      blocks: updatedBlocks,
      // Make sure it's not a draft
      publishedAt: Date.now(),
    },
  });
}

async function importCategories() {
  for (const category of categories) {
    await createEntry({ model: 'category', entry: category });
  }
}


async function importBlogsAndCategories() {
  const categoryMap = new Map();

  for (const categoryName of newCategories) {
    const existingCategory = await strapi.db.query('api::category.category').findOne({
      where: { Title: categoryName },
    });

    if (!existingCategory) {
      try {
        console.log(`Creating category: ${categoryName}`);
        const category = await strapi.entityService.create('api::category.category', {
          data: {
            Title: categoryName,
            Filter: categoryName,
            publishedAt: new Date(),
          },
        });
        categoryMap.set(categoryName, category.id);
      } catch (e) {
        console.error(`Error creating category: ${categoryName}`, e);
      }
    } else {
      categoryMap.set(categoryName, existingCategory.id);
    }
  }

  for (const blog of newBlogs) {
    const existingBlog = await strapi.db.query('api::blog.blog').findOne({
      where: { slug: blog.slug },
    });

    if (!existingBlog) {
      const categoryIds = blog.categories.map((catName) => categoryMap.get(catName));
      try {
        console.log(`Creating blog: ${blog.title}`);
        await strapi.entityService.create('api::blog.blog', {
          data: {
            ...blog,
            categories: categoryIds,
            publishedAt: new Date(),
          },
        });
      } catch (e) {
        console.error(`Error creating blog: ${blog.title}`, e);
      }
    } else {
      console.log(`Blog already exists: ${blog.title}`);
    }
  }
}

async function importSeedData() {
  // Allow read of application content types
  await setPublicPermissions({
    category: ['find', 'findOne'],
    global: ['find', 'findOne'],
    about: ['find', 'findOne'],
  });

  // Create all entries
  await importCategories();
  await importGlobal();
  await importAbout();

  if (process.env.SEED_BLOGS_AND_CATEGORIES === 'true') {
    await importBlogsAndCategories();
  }
}

async function main() {
  const { createStrapi, compileStrapi } = require('@strapi/strapi');

  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();

  app.log.level = 'error';

  await seedExampleApp();
  await app.destroy();

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
