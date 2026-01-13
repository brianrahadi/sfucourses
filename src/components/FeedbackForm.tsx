import React, { useState, useEffect } from "react";
import { MdFeedback, MdClose } from "react-icons/md";
import { useForm, ValidationError } from "@formspree/react";
import { Button } from "./Button";
import { toast } from "react-hot-toast";

export const FeedbackForm: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  // Replace "feedback" with the actual form key/id from your Formspree project
  // Ensure that 'feedback' matches the form key in your Formspree dashboard
  const [state, handleSubmit, reset] = useForm("contact");

  useEffect(() => {
    if (state.succeeded) {
      toast.success("Feedback sent! Thank you.");
      setIsOpen(false);
    }
  }, [state.succeeded]);

  const handleReset = () => {
    reset();
    setIsOpen(true);
  };

  return (
    <>
      <button
        className="feedback-form-trigger"
        onClick={() => setIsOpen(!isOpen)}
        title="Send Feedback"
        aria-label="Send Feedback"
      >
        <MdFeedback />
      </button>

      {isOpen && (
        <div
          className="feedback-form-overlay"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`feedback-dialog ${isOpen ? "open" : ""}`}>
        <div className="feedback-header">
          <h4>Send Feedback</h4>
          <button className="close-button" onClick={() => setIsOpen(false)}>
            <MdClose size={20} />
          </button>
        </div>

        <div className="feedback-content">
          {state.succeeded ? (
            <div
              style={{
                padding: "1rem",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <p>Thanks for your feedback!</p>
              <Button
                label="Send another feedback"
                onClick={handleReset}
                className="submit-btn"
              />
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email (optional)</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="your@email.com"
                />
                <ValidationError
                  prefix="Email"
                  field="email"
                  errors={state.errors}
                />
              </div>

              <div className="form-group">
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  name="message"
                  placeholder="give feedbacks here!"
                  required
                />
                <ValidationError
                  prefix="Message"
                  field="message"
                  errors={state.errors}
                />
              </div>

              <Button
                label={state.submitting ? "Sending..." : "Send Feedback"}
                className="submit-btn"
                disabled={state.submitting}
              />
            </form>
          )}
        </div>
      </div>
    </>
  );
};
