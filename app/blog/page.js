// @flow strict

export default function Page() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center py-20">
      <div className="flex justify-center my-5 lg:py-8">
        <div className="flex items-center">
          <span className="w-24 h-[2px] bg-[#1a1443]"></span>
          <span className="bg-[#1a1443] w-fit text-white p-2 px-5 text-2xl rounded-md">
            Blogs
          </span>
          <span className="w-24 h-[2px] bg-[#1a1443]"></span>
        </div>
      </div>

      <h1 className="text-5xl md:text-6xl font-medium text-gray-400 mt-12 text-center">Coming soon...</h1>
    </div>
  );
}