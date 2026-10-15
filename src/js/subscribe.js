// Sends the signup to Kit without leaving the page; falls back to a normal form post.
document.querySelectorAll("form[data-kit-form]").forEach((form) => {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const status = form.querySelector(".subscribe-status");
    const button = form.querySelector("button");
    button.disabled = true;
    status.textContent = "Sending…";
    try {
      const res = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || (data.status && data.status !== "success")) throw new Error("failed");
      form.classList.add("is-done");
      status.textContent = "Thank you. Check your inbox to confirm your subscription.";
    } catch (err) {
      form.removeAttribute("data-kit-form");
      form.submit();
    } finally {
      button.disabled = false;
    }
  });
});
