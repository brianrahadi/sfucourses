// pages/_document.tsx - Updated with safer data serialization

import Document, {
  Html,
  Head,
  Main,
  NextScript,
  DocumentContext,
} from "next/document";
import { getCourseAPIData } from "@utils";

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);

    // Only fetch the data on the server
    let courseSearchData = [];

    if (ctx.req) {
      try {
        // Fetch minimal course data for the global search
        const response = await getCourseAPIData("/outlines");
        courseSearchData = response.map((course: any) => ({
          dept: course.dept,
          number: course.number,
          title: course.title,
        }));
      } catch (error) {
        console.error("Error fetching global search data:", error);
      }
    }

    return {
      ...initialProps,
      courseSearchData,
    };
  }

  render() {
    return (
      <Html>
        <Head />
        <body>
          <Main />
          <NextScript />
          {/* Inject the search data into the window object with safer serialization */}
          <script
            dangerouslySetInnerHTML={{
              __html: `window.__COURSE_SEARCH_DATA__ = ${JSON.stringify(
                (this.props as any).courseSearchData || []
              ).replace(/</g, "\\u003c")}`,
            }}
          />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
