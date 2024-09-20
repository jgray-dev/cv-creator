import type { ActionFunction, MetaFunction } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { useState, useEffect } from "react";
import Anthropic from '@anthropic-ai/sdk';

export const meta: MetaFunction = () => {
  return [
    { title: "CV Creator" },
    { name: "description", content: "Create a tailored CV based on job listing" },
  ];
};

export const action: ActionFunction = async ({ request }) => {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  const formData = await request.formData();
  const userInfo = formData.get("userInfo") as string;
  const jobListing = formData.get("jobListing") as string;
  const msg = await anthropic.messages.create({
    model: "claude-3-sonnet-20240229",
    max_tokens: 4096,
    system: `You are a cover letter creator. Your task is to take the skills and experience from the user and create a cover letter for the job posting provided. Do NOT lie about technical skills, or infer skills. Use what's already there to mold a cover letter to the specific job posting. If you use the user's projects, you MUST include a brief description and link for each. Please do NOT include any follow up text ot boilerplate. Here is the job listing: ${jobListing}`,
    messages: [
      {
        role: "user",
        content: `User Information: ${userInfo}`
      },
    ]
  });
  return { fullResponse: msg.content[0].text };
};

export default function Index() {
  const actionData = useActionData<{ fullResponse: string }>();
  const navigation = useNavigation();
  const [userInfo, setUserInfo] = useState('');
  const [jobListing, setJobListing] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (navigation.state === "submitting") {
      setIsSubmitting(true);
    } else if (navigation.state === "idle") {
      setIsSubmitting(false);
    }
  }, [navigation.state]);

  const handleSubmit = (event: { preventDefault: () => void; }) => {
    if (!userInfo.trim() || !jobListing.trim()) {
      event.preventDefault();
      alert('Please fill in both the User Information and Job Listing fields.');
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-900 text-gray-100">
      <Form method="post" className="flex flex-col w-full md:w-1/2 p-4" onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="userInfo" className="block text-sm font-medium text-gray-300 mb-2">
            User Information (qualifications, skills, experience)
          </label>
          <textarea
            id="userInfo"
            name="userInfo"
            placeholder="Enter your qualifications, skills, and experience here."
            className="w-full h-64 p-2 border rounded-md bg-gray-800 text-gray-100 border-gray-700 placeholder-gray-500"
            value={userInfo}
            onChange={(e) => setUserInfo(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="jobListing" className="block text-sm font-medium text-gray-300 mb-2">
            Job Listing
          </label>
          <textarea
            id="jobListing"
            name="jobListing"
            placeholder="Enter the job listing here"
            className="w-full h-64 p-2 border rounded-md bg-gray-800 text-gray-100 border-gray-700 placeholder-gray-500"
            value={jobListing}
            onChange={(e) => setJobListing(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
      </Form>
      <div className="w-full md:w-1/2 p-4 bg-gray-800 overflow-auto">
        <h2 className="text-xl font-bold mb-4 text-gray-100">LLM Output</h2>
        {isSubmitting ? (
          <div className="text-gray-500">Waiting for response...</div>
        ) : actionData?.fullResponse ? (
          <div className="whitespace-pre-wrap text-gray-300">
            {actionData.fullResponse}
          </div>
        ) : (
          <div className="text-gray-500">LLM output will appear here after submission</div>
        )}
      </div>
    </div>
  );
}