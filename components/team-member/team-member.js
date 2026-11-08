class TeamMember extends HTMLElement {
  static get observedAttributes() {
    return ["avatar", "name", "department", "subsystem"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, _, newValue) {
    this[name] = newValue;
  }

  render() {
    const div = document.createElement("div");
    div.innerHTML = `
    <img src="${this.avatar}" alt="${this.name}">
    <p><strong>${this.name}</strong></p>
    <p>${this.department}</p>
    <p>${this.subsystem}</p>
    <style>
      :host {
        display: block;
        max-width: 170px;
        text-align: center;
      }

      img {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        object-fit: cover;
        display: block;
        margin: 0 auto 14px;
      }

      p {
        text-align: center;
        margin: 8px 0;
        line-height: 1.4;
      }

      @media (max-width: 599px) {
        img {
          display: none;
        }
      }
    </style>
  `;

    this.shadowRoot.appendChild(div);
  }
}

customElements.define("team-member", TeamMember);
