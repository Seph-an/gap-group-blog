'use strict';

const categories = [
  'recruitment',
  'payroll',
  'interviews',
  'CVs',
  'careers',
  'AI',
  'new-job',
];

const blogs = [
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

module.exports = {
  async run({ strapi }) {
    const categoryMap = new Map();

    for (const categoryName of categories) {
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
    }

    for (const blog of blogs) {
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
    }

    console.log('Done seeding!');
  },
};
