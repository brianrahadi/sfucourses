import Head from "next/head";

interface HelmetProps {
  pageTitle?: string;
}

export const Helmet: React.FC<HelmetProps> = ({ pageTitle = "" }) => {
  pageTitle = pageTitle.replace("/", "");
  pageTitle = pageTitle.replace("-", " ");

  const defaultTitle: string = "sfucourses";
  const title: string = `${pageTitle} - sfucourses`;
  const hasPageTitle: boolean = pageTitle.trim() !== "";

  return (
    <Head>
      <title>{hasPageTitle ? title : defaultTitle}</title>
      <meta name="viewport" content="initial-scale=1.0, width=device-width" />
    </Head>
  );
};

export default Helmet;
