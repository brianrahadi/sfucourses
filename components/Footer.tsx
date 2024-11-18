import Link from "next/link";

export const Footer: React.FC = () => {
  return (
    <div className="footer">
      <div className="container">
        <p>
          with (ɔ◔‿◔)ɔ ♥ by{" "}
          <Link href="https://brianrahadi.com" target="_blank" rel="noreferrer">
            brianrahadi
          </Link>{" "}
          - hire me pls
        </p>
      </div>
    </div>
  );
};
